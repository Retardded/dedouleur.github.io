// Configure your VPS backend URL here
// Replace with: http://YOUR_VPS_IP:3005
// Or: https://api.yourdomain.com (if using domain with SSL)
// Targeting VPS Backend
const API_BASE_URL = "https://cvrzdqq.mooo.com";

export type Project = {
  id: number;
  title: string;
  description: string;
  year: string;
  category: string;
  image?: string;
  video?: string;
  type?: "image" | "video";
};

// Получить все проекты
export async function fetchProjects(): Promise<Project[]> {
  try {
    console.log("Fetching projects from:", `${API_BASE_URL}/api/projects`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      // Если сервер вернул ошибку, пробрасываем её дальше
      if (response.status === 404 || response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Fetched projects:", data?.length || 0, "items");

    if (Array.isArray(data)) {
      // Cloudinary URLs are already full URLs, no need to modify
      return data;
    }
    return [];
  } catch (error: any) {
    // Если это ошибка сети (сервер недоступен), пробрасываем её
    if (error.name === "AbortError") {
      console.error("Request timeout - server may be offline");
      throw new Error(
        "Server is not available. Make sure backend is running on port 3005.",
      );
    }
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("NetworkError") ||
      error.name === "TypeError"
    ) {
      console.error("Network error - server may be offline:", error);
      throw new Error(
        "Server is not available. Make sure backend is running on port 3005.",
      );
    }
    console.error("Error fetching projects:", error);
    throw error;
  }
}

// Сохранить проекты
export async function saveProjects(projects: Project[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projects),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Save failed:", response.status, errorText);
      throw new Error(`Failed to save projects: ${response.status} ${errorText}`);
    }

    return true;
  } catch (error: any) {
    console.error("Error saving projects:", error);
    // Check for mixed content error
    if (error.message?.includes("mixed content") || error.message?.includes("insecure")) {
      console.error("⚠️ Mixed content blocked: HTTPS site cannot call HTTP backend. Set up HTTPS on VPS or use Cloudflare proxy.");
    }
    return false;
  }
}

// Загрузить изображение
export async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    // Cloudinary returns full URL already, no need to prepend
    return data.url;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

// Удалить изображение
export async function deleteImage(filename: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/images/${filename}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

// Извлечь имя файла из URL
export function getImageFilename(imageUrl: string): string | null {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/images\/([^\/]+)$/);
  return match ? match[1] : null;
}
