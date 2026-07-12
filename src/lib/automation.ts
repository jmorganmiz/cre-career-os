import { defaultOpportunityCriteria } from "@/lib/career-profile";
import { runOpportunitySearch } from "@/lib/opportunity-agent";
import { getServerSupabase } from "@/lib/server-supabase";
import type { AgentUsage } from "@/lib/openai-agent";
import type { AutomationRun, AutomationSettings, OpportunityRun } from "@/lib/types";

export const MONTHLY_LIMIT_USD = 35;
export const RUN_RESERVE_USD = 7;

function isoDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function estimateCost(usage?: AgentUsage) {
  if (!usage) return 0;
  const inputRate = numberValue(process.env.OPENAI_INPUT_USD_PER_MILLION || 3);
  const outputRate = numberValue(process.env.OPENAI_OUTPUT_USD_PER_MILLION || 15);
  const webSearchRate = numberValue(process.env.OPENAI_WEB_SEARCH_USD_PER_CALL || 0.02);
  return Number((usage.inputTokens / 1_000_000 * inputRate + usage.outputTokens / 1_000_000 * outputRate + usage.webSearchCalls * webSearchRate).toFixed(4));
}

function normalizedText(value?: string) {
  return (value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function specificSourceUrl(value?: string) {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim());
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "ref") url.searchParams.delete(key);
    }
    const path = url.pathname.replace(/\/$/, "");
    if (/\/(careers?|jobs?|opportunities)$/i.test(path)) return "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return "";
  }
}

function opportunityKeys(opportunity: { firm_name?: string; role_title?: string; source_url?: string }) {
  const keys = [`role:${normalizedText(opportunity.firm_name)}|${normalizedText(opportunity.role_title)}`];
  const source = specificSourceUrl(opportunity.source_url);
  if (source) keys.push(`url:${source}`);
  return keys;
}

async function ensureSettings(userId: string) {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");

  const { data: existing, error: readError } = await admin.from("automation_settings").select("*").eq("user_id", userId).maybeSingle();
  if (readError) throw readError;
  if (existing) return existing as AutomationSettings;

  const { data, error } = await admin.from("automation_settings").insert({
    user_id: userId,
    enabled: false,
    monthly_limit_usd: MONTHLY_LIMIT_USD,
    run_reserve_usd: RUN_RESERVE_USD,
  }).select().single();
  if (error) throw error;
  return data as AutomationSettings;
}

export async function getAutomationSnapshot(userId: string) {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");
  const settings = await ensureSettings(userId);

  const { data, error } = await admin.from("automation_runs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(12);
  if (error) throw error;
  const runs = (data || []) as AutomationRun[];
  const reservedThisMonth = runs
    .filter((run) => Boolean(run.created_at && run.created_at >= monthStart()))
    .reduce((sum, run) => sum + numberValue(run.reserved_cost_usd), 0);
  const estimatedThisMonth = runs
    .filter((run) => Boolean(run.created_at && run.created_at >= monthStart()))
    .reduce((sum, run) => sum + numberValue(run.estimated_cost_usd), 0);

  return {
    settings: { ...settings, monthly_limit_usd: MONTHLY_LIMIT_USD, run_reserve_usd: RUN_RESERVE_USD },
    runs,
    budget: {
      limit: MONTHLY_LIMIT_USD,
      reserved: Number(reservedThisMonth.toFixed(2)),
      estimated: Number(estimatedThisMonth.toFixed(4)),
      remaining: Math.max(0, Number((MONTHLY_LIMIT_USD - reservedThisMonth).toFixed(2))),
    },
    schedule: "Daily at 14:00 UTC (8/9 AM Central)",
    currentRunKey: isoDateKey(),
  };
}

export async function setAutomationEnabled(userId: string, enabled: boolean) {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");
  const { error } = await admin.from("automation_settings").upsert({
    user_id: userId,
    enabled,
    monthly_limit_usd: MONTHLY_LIMIT_USD,
    run_reserve_usd: RUN_RESERVE_USD,
  }, { onConflict: "user_id" });
  if (error) throw error;
  return getAutomationSnapshot(userId);
}

export async function executeWeeklyAutomation(userId: string, manual = false) {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");

  const settings = await ensureSettings(userId);
  if (!settings.enabled && !manual) return { status: "disabled" as const };

  const runKey = manual ? `${isoDateKey()}-manual-${Date.now()}` : isoDateKey();
  if (!manual) {
    const { data: existing, error: existingError } = await admin.from("automation_runs").select("*").eq("user_id", userId).eq("run_key", runKey).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return { status: "duplicate" as const, run: existing as AutomationRun };

    const { data: monthRuns, error: monthError } = await admin.from("automation_runs").select("reserved_cost_usd").eq("user_id", userId).gte("created_at", monthStart());
    if (monthError) throw monthError;
    const reserved = (monthRuns || []).reduce((sum, run) => sum + numberValue(run.reserved_cost_usd), 0);
    if (reserved + RUN_RESERVE_USD > MONTHLY_LIMIT_USD) return { status: "budget_exhausted" as const };
  }

  const { data: run, error: insertError } = await admin.from("automation_runs").insert({
    user_id: userId,
    run_key: runKey,
    status: "running",
    reserved_cost_usd: manual ? 0 : RUN_RESERVE_USD,
  }).select().single();
  if (insertError?.code === "23505") return { status: "duplicate" as const };
  if (insertError) throw insertError;

  try {
    const result = await runOpportunitySearch(defaultOpportunityCriteria);
    if ("agent_error" in result.brief && result.brief.agent_error) throw new Error(result.brief.agent_error);

    const { data: priorRuns, error: priorError } = await admin.from("opportunity_runs").select("output").eq("user_id", userId).order("created_at", { ascending: false }).limit(12);
    if (priorError) throw priorError;
    const priorKeys = new Set((priorRuns || []).flatMap((prior) => {
      const output = prior.output as OpportunityRun["output"];
      return (output.opportunities || []).flatMap((opportunity) => opportunityKeys(opportunity));
    }));
    const opportunities = (result.brief.opportunities || []).filter((opportunity) => {
      const keys = opportunityKeys(opportunity);
      const duplicate = keys.some((key) => priorKeys.has(key));
      keys.forEach((key) => priorKeys.add(key));
      return !duplicate;
    });
    const brief = {
      ...result.brief,
      opportunities,
      search_summary: opportunities.length === result.brief.opportunities.length
        ? result.brief.search_summary
        : `${result.brief.search_summary} ${result.brief.opportunities.length - opportunities.length} duplicate role(s) were removed.`,
    };

    const { error: saveError } = await admin.from("opportunity_runs").insert({
      user_id: userId,
      input: { ...defaultOpportunityCriteria, automation: manual ? "manual" : "daily" },
      output: brief,
    });
    if (saveError) throw saveError;

    if (opportunities.length) {
      const inboxRows = opportunities.map((opportunity) => ({
        user_id: userId,
        job_type: "daily_opportunities",
        run_id: run.id,
        title: `${opportunity.firm_name || "Unknown firm"} - ${opportunity.role_title || "Opportunity"}`,
        summary: `Fit ${opportunity.fit_score ?? "-"} | Timing ${opportunity.timing_score ?? "-"} | ${opportunity.opportunity_type || "Role"}`,
        payload: opportunity,
        status: "new",
      }));
      const { error: inboxError } = await admin.from("automation_results").insert(inboxRows);
      if (inboxError) throw inboxError;
    }

    const estimatedCost = estimateCost(result.usage);
    const completedAt = new Date().toISOString();
    const { data: completed, error: updateError } = await admin.from("automation_runs").update({
      status: "completed",
      estimated_cost_usd: estimatedCost,
      input_tokens: result.usage?.inputTokens || 0,
      output_tokens: result.usage?.outputTokens || 0,
      web_search_calls: result.usage?.webSearchCalls || 0,
      opportunity_count: opportunities.length,
      completed_at: completedAt,
    }).eq("id", run.id).select().single();
    if (updateError) throw updateError;

    await admin.from("automation_settings").update({ last_run_at: completedAt }).eq("user_id", userId);
    return { status: "completed" as const, run: completed as AutomationRun, brief };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automated opportunity search failed.";
    await admin.from("automation_runs").update({ status: "failed", error: message.slice(0, 1200), completed_at: new Date().toISOString() }).eq("id", run.id);
    throw error;
  }
}
