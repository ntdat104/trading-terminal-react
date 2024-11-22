import { createHash } from "crypto";

export const generateCacheKey = (
  url: string,
  method: "GET" | "POST" = "GET",
  timeout: number,
  disable: boolean,
  body?: any
) => {
  const bodyHash = body
    ? createHash("sha256").update(JSON.stringify(body)).digest("hex")
    : "";
  return `${method}:${url}:${bodyHash}:${timeout}:${disable.toString()}`;
};
