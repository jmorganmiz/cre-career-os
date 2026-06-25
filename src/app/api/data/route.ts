import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Resource = "firms" | "contacts" | "applications";

type SupabaseError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const ownerId = process.env.APP_USER_ID || "00000000-0000-0000-0000-000000000001";
function normalizeSecret(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function normalizeSupabaseUrl(value?: string) {
  const cleaned = normalizeSecret(value);
  if (!cleaned) return undefined;
  try {
    const url = new URL(cleaned);
    const dashboardMatch = url.pathname.match(/\/project\/([^/]+)/);
    if (url.hostname === "supabase.com" && dashboardMatch?.[1]) {
      return `https://${dashboardMatch[1]}.supabase.co`;
    }
    if (url.hostname.endsWith(".supabase.co")) {
      return url.origin;
    }
  } catch {
    return cleaned;
  }
  return cleaned;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceKey = normalizeSecret(process.env.SUPABASE_SERVICE_ROLE_KEY);
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;
const optionalUuidFields = new Set(["firm_id", "referral_contact_id"]);
const optionalDateFields = new Set(["date_applied", "follow_up_at", "last_contacted_at"]);

function unavailable() {
  return NextResponse.json({ configured: false, error: "Server Supabase sync is not configured." }, { status: 503 });
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const value = error as SupabaseError;
    return [value.message, value.details, value.hint, value.code].filter(Boolean).join(" | ") || fallback;
  }
  return fallback;
}

function cleanRecord(record: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === "id" && !value) continue;
    if ((optionalUuidFields.has(key) || optionalDateFields.has(key)) && value === "") {
      cleaned[key] = null;
      continue;
    }
    if (key === "relationship_score") {
      cleaned[key] = value === "" || value == null ? null : Number(value);
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

async function loadData() {
  if (!admin) return null;
  const [firms, contacts, applications, opportunityRuns, researchRuns, activityLog] = await Promise.all([
    admin.from("firms").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }),
    admin.from("contacts").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }),
    admin.from("applications").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }),
    admin.from("opportunity_runs").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(12),
    admin.from("research_runs").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(12),
    admin.from("activity_log").select("*").eq("user_id", ownerId).order("completed_at", { ascending: false }).limit(100),
  ]);

  const error = firms.error || contacts.error || applications.error || opportunityRuns.error || researchRuns.error || activityLog.error;
  if (error) throw error;

  return {
    configured: true,
    firms: firms.data || [],
    contacts: contacts.data || [],
    applications: applications.data || [],
    opportunityRuns: opportunityRuns.data || [],
    researchRuns: researchRuns.data || [],
    activityLog: activityLog.data || [],
  };
}

export async function GET() {
  if (!admin) return unavailable();
  try {
    return NextResponse.json(await loadData());
  } catch (error) {
    console.error("Data sync load failed", error);
    return NextResponse.json({ configured: true, error: errorMessage(error, "Could not load data.") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!admin) return unavailable();
  const body = await request.json();

  try {
    if (body.action === "add") {
      const resource = body.resource as Resource;
      const { data, error } = await admin.from(resource).insert({ ...cleanRecord(body.value), user_id: ownerId }).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "update") {
      const resource = body.resource as Resource;
      const { data, error } = await admin.from(resource).update(cleanRecord(body.value)).eq("id", body.id).eq("user_id", ownerId).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "remove") {
      const resource = body.resource as Resource;
      const { error } = await admin.from(resource).delete().eq("id", body.id).eq("user_id", ownerId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "importMany") {
      const resource = body.resource as Resource;
      const items = body.items.map((item: Record<string, unknown>) => ({ ...cleanRecord(item), user_id: ownerId }));
      const { data, error } = await admin.from(resource).insert(items).select();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "opportunityRun") {
      const { data, error } = await admin.from("opportunity_runs").insert({ input: body.input, output: body.output, user_id: ownerId }).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "researchRun") {
      const { data, error } = await admin.from("research_runs").insert({ input: body.input, output: body.output, firm_id: body.firmId || null, user_id: ownerId }).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "completeAction") {
      const { error } = await admin.from("activity_log").upsert({ ...cleanRecord(body.activity), user_id: ownerId }, { onConflict: "user_id,action_id" });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown data action." }, { status: 400 });
  } catch (error) {
    console.error("Data sync action failed", error);
    return NextResponse.json({ error: errorMessage(error, "Data action failed.") }, { status: 500 });
  }
}


