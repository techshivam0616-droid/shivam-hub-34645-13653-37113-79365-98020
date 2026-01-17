import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "You are a helpful AI assistant. Be concise and helpful.";
    let selectedModel = model || "google/gemini-3-flash-preview";

    // Different system prompts based on type
    switch (type) {
      case "description":
        systemPrompt = `You are an expert content writer. Generate a compelling, SEO-friendly description for the given title. Keep it between 50-150 words. Make it engaging and informative. Only return the description text, nothing else.`;
        break;
      case "code":
        systemPrompt = `You are an expert full-stack developer. Generate complete, production-ready code based on the user's requirements. Include all necessary files, proper structure, and comments. Use modern best practices. Format your response with clear file separations using markdown code blocks with filenames.`;
        selectedModel = "google/gemini-2.5-pro";
        break;
      case "research":
        systemPrompt = `You are an expert researcher. Provide comprehensive, well-structured research on the given topic. Include key findings, analysis, and references where applicable. Be thorough but organized.`;
        selectedModel = "google/gemini-2.5-pro";
        break;
      case "academic":
        systemPrompt = `You are an academic expert. Help with academic writing, essay structure, research papers, and scholarly content. Provide well-researched, properly formatted academic content.`;
        break;
      case "test":
        systemPrompt = `You are a test and quiz maker. Create comprehensive tests, quizzes, or exam questions based on the given topic or subject. Include multiple choice, true/false, short answer, and essay questions as appropriate. Provide answer keys.`;
        break;
      case "chat":
      default:
        systemPrompt = `You are Tech AI, a helpful and knowledgeable AI assistant. You can help with coding, research, writing, and general questions. Be friendly, concise, and helpful.`;
        break;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
