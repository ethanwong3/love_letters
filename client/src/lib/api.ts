export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  // If body is FormData, don't set Content-Type (browser will add boundary)
  const isFormData = typeof (options as any).body !== "undefined" && (options as any).body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options && options.headers) ? Object.fromEntries(
      Object.entries(options.headers).map(([key, value]) => [key, String(value)])
    ) : {}),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // try to parse JSON error
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || text);
    } catch {
      throw new Error(text);
    }
  }
  return res.json();
}
