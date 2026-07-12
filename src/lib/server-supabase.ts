import { createClient } from "@supabase/supabase-js";

export const LEGACY_OWNER_ID = "00000000-0000-0000-0000-000000000001";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeSecret(value?: string) {
  return value?.trim().replace(/^[']|[']$/g, "").replace(/^[\"]|[\"]$/g, "");
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
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return url && key ? createClient(url, key) : null;
}

export function getOwnerId() {
  const ownerId = normalizeSecret(process.env.CAREEROS_OWNER_ID);
  if (!ownerId || !UUID_PATTERN.test(ownerId)) throw new Error("CAREEROS_OWNER_ID is not configured.");
  return ownerId;
}

export function privateDeploymentAcknowledged() {
  return normalizeSecret(process.env.CAREEROS_PRIVATE_DEPLOYMENT_ACK)?.toLowerCase() === "true";
}
