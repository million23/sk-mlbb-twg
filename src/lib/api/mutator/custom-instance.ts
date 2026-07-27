import { pb } from "@/lib/pocketbase";

/**
 * Orval fetch mutator for PocketBase REST (`/api/...`).
 * Attaches the current auth token when present.
 */
export const customInstance = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const base = (
    import.meta.env.VITE_POCKETHOST_URL?.trim() || "https://pb.sk-mlbb-twg.com"
  ).replace(/\/$/, "");

  // OpenAPI servers use `/api` as base; generated paths are like `/collections/...`
  const path = url.startsWith("http")
    ? url
    : `${base}/api${url.startsWith("/") ? url : `/${url}`}`;

  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  // Browser must set multipart boundary for FormData — never force JSON here.
  if (isFormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = pb.authStore.token;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : response.statusText || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type ErrorType<Error> = ApiError & { data: Error };
export type BodyType<BodyData> = BodyData;
