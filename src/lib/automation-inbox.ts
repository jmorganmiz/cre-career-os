import type { SupabaseClient } from "@supabase/supabase-js";

export type InboxAction = "dismiss" | "save";

type AutomationResultRow = {
  id: string;
  title: string;
  payload?: Record<string, unknown> | null;
};

type FirmRow = {
  id: string;
  name: string;
};

type ApplicationRow = {
  id: string;
  firm_id?: string | null;
  role_title?: string | null;
  job_url?: string | null;
};

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function reviewedAt(now: Date) {
  return now.toISOString();
}

export async function handleAutomationInboxAction(
  admin: SupabaseClient,
  userId: string,
  id: string,
  action: InboxAction,
  now = new Date(),
) {
  const { data: result, error: readError } = await admin
    .from("automation_results")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single<AutomationResultRow>();
  if (readError) throw readError;

  if (action === "dismiss") {
    const { error } = await admin
      .from("automation_results")
      .update({ status: "dismissed", reviewed_at: reviewedAt(now) })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true, status: "dismissed" as const, duplicate: false };
  }

  const payload = result.payload || {};
  const firmName = String(payload.firm_name || "Unknown firm").trim();
  let firmId: string | null = null;

  if (firmName && firmName !== "Unknown firm") {
    const { data: firms, error: firmReadError } = await admin
      .from("firms")
      .select("id,name")
      .eq("user_id", userId)
      .returns<FirmRow[]>();
    if (firmReadError) throw firmReadError;

    const existing = (firms || []).find((firm) => normalize(firm.name) === normalize(firmName));
    if (existing) {
      firmId = existing.id;
    } else {
      const { data: created, error: createError } = await admin
        .from("firms")
        .insert({
          user_id: userId,
          name: firmName,
          priority: "Tier 2",
          notes: "Added from Automation Inbox.",
        })
        .select("id")
        .single<{ id: string }>();
      if (createError) throw createError;
      firmId = created.id;
    }
  }

  const roleTitle = String(payload.role_title || result.title || "Opportunity").trim();
  const sourceUrl = String(payload.source_url || "").trim();
  const { data: existingApplications, error: appReadError } = await admin
    .from("applications")
    .select("id,firm_id,role_title,job_url")
    .eq("user_id", userId)
    .returns<ApplicationRow[]>();
  if (appReadError) throw appReadError;

  const duplicate = (existingApplications || []).find((app) => {
    if (sourceUrl && app.job_url === sourceUrl) return true;
    return Boolean(firmId && app.firm_id === firmId && normalize(app.role_title) === normalize(roleTitle));
  });

  if (!duplicate) {
    const { error: appError } = await admin.from("applications").insert({
      user_id: userId,
      firm_id: firmId,
      role_title: roleTitle,
      job_url: sourceUrl || null,
      status: "Saved",
      interview_stage: "Prospect",
      notes: `Added from automation. Fit score: ${payload.fit_score ?? "n/a"}.`,
    });
    if (appError) throw appError;
  }

  const { error: updateError } = await admin
    .from("automation_results")
    .update({ status: "saved", reviewed_at: reviewedAt(now) })
    .eq("id", id)
    .eq("user_id", userId);
  if (updateError) throw updateError;

  return { ok: true, status: "saved" as const, duplicate: Boolean(duplicate) };
}
