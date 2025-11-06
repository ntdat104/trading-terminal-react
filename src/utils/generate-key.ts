export const generateCacheKey = async (
  url: string,
  method: "GET" | "POST" = "GET",
  timeout: number,
  disable: boolean,
  body?: any
) => {
  const encoded = new TextEncoder().encode(JSON.stringify(body || ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const bodyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return `${method}:${url}:${bodyHash}:${timeout}:${disable.toString()}`;
};
