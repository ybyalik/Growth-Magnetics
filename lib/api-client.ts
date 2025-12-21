import { auth } from "./firebase";

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        console.error("Error getting ID token:", error);
      }
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function get(url: string): Promise<Response> {
  return apiRequest(url, { method: "GET" });
}

export async function post(url: string, body: any): Promise<Response> {
  return apiRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function put(url: string, body: any): Promise<Response> {
  return apiRequest(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
