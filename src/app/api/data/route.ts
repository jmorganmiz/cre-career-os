import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

type Resource = "firms" | "contacts" | "applications";

type SupabaseError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

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
    if (key === "user_id") continue;
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

function normalizedText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}

function normalizedUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "ref") url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}

function isGenericCareersUrl(value: unknown) {
  const url = normalizedUrl(value);
  if (!url) return true;
  try {
    const path = new URL(url).pathname.replace(/\/$/, "");
    return /\/(careers?|jobs?|opportunities)$/i.test(path);
  } catch {
    return false;
  }
}

type AdminClient = NonNullable<ReturnType<typeof getServerSupabase>>;

async function findExisting(admin: AdminClient, userId: string, resource: Resource, value: Record<string, unknown>) {
  if (resource === "firms") {
    const { data, error } = await admin.from("firms").select("*").eq("user_id", userId);
    if (error) throw error;
    return data?.find((firm) => normalizedText(firm.name) === normalizedText(value.name)) || null;
  }
  if (resource === "applications") {
    const { data, error } = await admin.from("applications").select("*").eq("user_id", userId);
    if (error) throw error;
    const incomingUrl = normalizedUrl(value.job_url);
    const incomingRole = normalizedText(value.role_title);
    return data?.find((application) => {
      const sameUrl = incomingUrl && !isGenericCareersUrl(incomingUrl) && normalizedUrl(application.job_url) === incomingUrl;
      const sameRoleAtFirm = incomingRole === normalizedText(application.role_title)
        && (application.firm_id || null) === (value.firm_id || null);
      return Boolean(sameUrl || sameRoleAtFirm);
    }) || null;
  }
  return null;
}

async function loadData(admin: AdminClient, userId: string) {
  const [firms, contacts, applications, opportunityRuns, researchRuns, activityLog] = await Promise.all([
    admin.from("firms").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("opportunity_runs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
    admin.from("research_runs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
    admin.from("activity_log").select("*").eq("user_id", userId).order("completed_at", { ascending: false }).limit(100),
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
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const admin = getServerSupabase();
  if (!admin) return unavailable();
  try {
    return NextResponse.json(await loadData(admin, auth.user.id));
  } catch (error) {
    console.error("Data sync load failed", error);
    return NextResponse.json({ configured: true, error: errorMessage(error, "Could not load data.") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const admin = getServerSupabase();
  if (!admin) return unavailable();
  const body = await request.json();
  const userId = auth.user.id;

  try {
    if (body.action === "add") {
      const resource = body.resource as Resource;
      const value = cleanRecord(body.value);
      const existing = await findExisting(admin, userId, resource, value);
      if (existing) return NextResponse.json({ data: existing, duplicate: true });
      const { data, error } = await admin.from(resource).insert({ ...value, user_id: userId }).select().single();
      if (error) throw error;
      return NextResponse.json({ data, duplicate: false });
    }

    if (body.action === "update") {
      const resource = body.resource as Resource;
      const { data, error } = await admin.from(resource).update(cleanRecord(body.value)).eq("id", body.id).eq("user_id", userId).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "remove") {
      const resource = body.resource as Resource;
      const { error } = await admin.from(resource).delete().eq("id", body.id).eq("user_id", userId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "importMany") {
      const resource = body.resource as Resource;
      const items = body.items.map((item: Record<string, unknown>) => ({ ...cleanRecord(item), user_id: userId }));
      const { data, error } = await admin.from(resource).insert(items).select();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "opportunityRun") {
      const { data, error } = await admin.from("opportunity_runs").insert({ input: body.input, output: body.output, user_id: userId }).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "researchRun") {
      const { data, error } = await admin.from("research_runs").insert({ input: body.input, output: body.output, firm_id: body.firmId || null, user_id: userId }).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (body.action === "completeAction") {
      const { error } = await admin.from("activity_log").upsert({ ...cleanRecord(body.activity), user_id: userId }, { onConflict: "user_id,action_id" });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown data action." }, { status: 400 });
  } catch (error) {
    console.error("Data sync action failed", error);
    return NextResponse.json({ error: errorMessage(error, "Data action failed.") }, { status: 500 });
  }
}


