export const ACCESS_COOKIE_NAME = "careeros_access";

export function normalizeSecret(value?: string) {
  return value?.trim().replace(/^[']|[']$/g, "").replace(/^[\"]|[\"]$/g, "");
}

export function getAccessKey() {
  return normalizeSecret(process.env.CAREEROS_ACCESS_KEY);
}

export function accessConfigured() {
  return Boolean(getAccessKey());
}

export async function accessHash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function safeInternalPath(value: FormDataEntryValue | string | null | undefined, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const base = "https://career-os.local";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
