const IMGBB_API_KEY = "1e0afe690d70016376faa5e0678ef98c";

export interface ImgBBResponse {
  success: boolean;
  data?: {
    url: string;
    display_url: string;
    delete_url: string;
    thumb: {
      url: string;
    };
  };
  error?: {
    message: string;
  };
}

export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("key", IMGBB_API_KEY);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const data: ImgBBResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || "Failed to upload image");
  }

  return data.data.display_url;
}

export async function uploadBase64ToImgBB(base64Image: string): Promise<string> {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  const formData = new FormData();
  formData.append("image", base64Data);
  formData.append("key", IMGBB_API_KEY);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const data: ImgBBResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || "Failed to upload image");
  }

  return data.data.display_url;
}
