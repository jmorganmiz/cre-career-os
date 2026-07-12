import { NextResponse } from "next/server";
import { requirePrivateDeployment } from "@/lib/private-deployment";
import { accessConfigured } from "@/lib/private-access";

export const dynamic = "force-dynamic";

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

export function GET() {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceKey = normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const openaiKey = normalizeSecret(process.env.OPENAI_API_KEY);
  const ownerId = normalizeSecret(process.env.CAREEROS_OWNER_ID);
  return NextResponse.json({
    ok: true,
    supabase: { configured: Boolean(supabaseUrl && serviceKey), urlHost: supabaseUrl ? new URL(supabaseUrl).hostname : null },
    openai: { configured: Boolean(openaiKey), model: process.env.OPENAI_MODEL || "gpt-4.1-mini" },
    privateAccess: { configured: accessConfigured(), ownerConfigured: Boolean(ownerId), ownerSuffix: ownerId ? ownerId.slice(-6) : null },
  });
}
