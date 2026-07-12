const DEFAULT_INTERNAL_PATH = "/";
const PROTOCOL_PATTERN = /[a-zA-Z][a-zA-Z\d+.-]*:/;

export function safeInternalPath(value: string | null | undefined, origin = "https://career-os.local") {
  const candidate = value?.trim();
  if (!candidate) return DEFAULT_INTERNAL_PATH;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return DEFAULT_INTERNAL_PATH;
  if (PROTOCOL_PATTERN.test(candidate)) return DEFAULT_INTERNAL_PATH;

  try {
    decodeURI(candidate);
    const resolved = new URL(candidate, origin);
    if (resolved.origin !== origin) return DEFAULT_INTERNAL_PATH;
    return `${resolved.pathname}${resolved.search}${resolved.hash}` || DEFAULT_INTERNAL_PATH;
  } catch {
    return DEFAULT_INTERNAL_PATH;
  }
}
