import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  tokens: string[];
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/firebase.messaging"
  };

  // Base64URL encode
  const base64url = (obj: any) => {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const unsignedToken = `${base64url(header)}.${base64url(payload)}`;

  // Import the private key and sign
  const privateKey = serviceAccount.private_key;
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${unsignedToken}.${signatureBase64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    console.error("Token exchange failed:", tokenData);
    throw new Error("Failed to get access token");
  }

  return tokenData.access_token;
}

async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string
): Promise<{ success: boolean; token: string; error?: string }> {
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: title,
              body: body,
            },
            webpush: {
              notification: {
                icon: "/favicon.ico",
                badge: "/favicon.ico",
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`FCM send failed for token ${token.substring(0, 20)}...:`, errorData);
      return { success: false, token, error: errorData.error?.message || "Unknown error" };
    }

    console.log(`Successfully sent to token: ${token.substring(0, 20)}...`);
    return { success: true, token };
  } catch (error) {
    console.error(`Error sending to token ${token.substring(0, 20)}...:`, error);
    return { success: false, token, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    if (!projectId) {
      throw new Error("Invalid service account: missing project_id");
    }

    const { title, body, tokens }: NotificationPayload = await req.json();

    if (!title || !body || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, body, tokens" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notification to ${tokens.length} devices...`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);
    console.log("Successfully obtained access token");

    // Send to all tokens in parallel
    const results = await Promise.all(
      tokens.map(token => sendFCMNotification(accessToken, projectId, token, title, body))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`Sent: ${successful}/${tokens.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed: failed.length,
        total: tokens.length,
        errors: failed.map(f => ({ token: f.token.substring(0, 20) + '...', error: f.error }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
