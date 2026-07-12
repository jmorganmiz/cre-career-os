import { createClient } from "@supabase/supabase-js";

export const LEGACY_OWNER_ID = "00000000-0000-0000-0000-000000000001";

function normalizeSecret(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function normalizeSupabaseUrl(value?: string) {
  const cleaned = normalizeSecret(value);
  if (!cleaned) return undefined;
  try {
    const url = new URL(cleaned);
    const dashboardMatch = url.pathname.match(/\/project\/([^/]+)/);
    if (url.hostname === "supabase.com" && dashboardMatch?.[1]) return `https://${dashboardMatch[1]}.supabase.co`;
    if (url.hostname.endsWith(".supabase.co")) return url.origin;
  } catch {
    return cleaned;
  }
  return cleaned;
}

export function getServerSupabase() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return url && key ? createClient(url, key) : null;
}
