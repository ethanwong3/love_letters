export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  // If body is FormData, don't set Content-Type (browser will add boundary)
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options && options.headers) ? Object.fromEntries(
      Object.entries(options.headers).map(([key, value]) => [key, String(value)])
    ) : {}),
    ...(token && !(options.headers && (options.headers as Record<string, string>)["Authorization"]) ? { Authorization: `Bearer ${token}` } : {}),
  };

  console.debug("apiFetch: Sending request", {
    url: `${process.env.NEXT_PUBLIC_API_URL}${url}`,
    options: { ...options, headers },
  });

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      ...options,
      headers, // Ensure all headers are passed, including Spotify-Access-Token
    });

    console.debug("apiFetch: Received response", {
      status: res.status,
      statusText: res.statusText,
    });

    if (!res.ok) {
      // Try to parse JSON error
      const text = await res.text();
      console.error("apiFetch: Response error body", text);
      try {
        throw new Error(JSON.parse(text).message || text);
      } catch {
        throw new Error(text);
      }
    }

    const data = await res.json();
    console.debug("apiFetch: Response data", data);
    return data;
  } catch (error) {
    console.error("apiFetch: Fetch error", error);
    throw error;
  }
}