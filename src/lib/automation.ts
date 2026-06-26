import { defaultOpportunityCriteria } from "@/lib/career-profile";
import { runOpportunitySearch } from "@/lib/opportunity-agent";
import { getServerSupabase, ownerId } from "@/lib/server-supabase";
import type { AgentUsage } from "@/lib/openai-agent";
import type { AutomationRun, AutomationSettings, OpportunityRun } from "@/lib/types";

export const MONTHLY_LIMIT_USD = 35;
export const RUN_RESERVE_USD = 7;

function isoWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
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

function opportunityKey(opportunity: { firm_name?: string; role_title?: string }) {
  return `${opportunity.firm_name || ""}|${opportunity.role_title || ""}`.trim().toLowerCase();
}

async function ensureSettings() {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");

  const { data: existing, error: readError } = await admin.from("automation_settings").select("*").eq("user_id", ownerId).maybeSingle();
  if (readError) throw readError;
  if (existing) return existing as AutomationSettings;

  const { data, error } = await admin.from("automation_settings").insert({
    user_id: ownerId,
    enabled: false,
    monthly_limit_usd: MONTHLY_LIMIT_USD,
    run_reserve_usd: RUN_RESERVE_USD,
  }).select().single();
  if (error) throw error;
  return data as AutomationSettings;
}

export async function getAutomationSnapshot() {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");
  const settings = await ensureSettings();

  const { data, error } = await admin.from("automation_runs").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(12);
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
    schedule: "Mondays at 14:00 UTC (8/9 AM Central)",
    currentRunKey: isoWeekKey(),
  };
}

export async function setAutomationEnabled(enabled: boolean) {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");
  const { error } = await admin.from("automation_settings").upsert({
    user_id: ownerId,
    enabled,
    monthly_limit_usd: MONTHLY_LIMIT_USD,
    run_reserve_usd: RUN_RESERVE_USD,
  }, { onConflict: "user_id" });
  if (error) throw error;
  return getAutomationSnapshot();
}

export async function executeWeeklyAutomation(manual = false) {
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");

  const settings = await ensureSettings();
  if (!settings.enabled && !manual) return { status: "disabled" as const };

  const runKey = isoWeekKey();
  const { data: existing, error: existingError } = await admin.from("automation_runs").select("*").eq("user_id", ownerId).eq("run_key", runKey).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { status: "duplicate" as const, run: existing as AutomationRun };

  const { data: monthRuns, error: monthError } = await admin.from("automation_runs").select("reserved_cost_usd").eq("user_id", ownerId).gte("created_at", monthStart());
  if (monthError) throw monthError;
  const reserved = (monthRuns || []).reduce((sum, run) => sum + numberValue(run.reserved_cost_usd), 0);
  if (reserved + RUN_RESERVE_USD > MONTHLY_LIMIT_USD) return { status: "budget_exhausted" as const };

  const { data: run, error: insertError } = await admin.from("automation_runs").insert({
    user_id: ownerId,
    run_key: runKey,
    status: "running",
    reserved_cost_usd: RUN_RESERVE_USD,
  }).select().single();
  if (insertError?.code === "23505") return { status: "duplicate" as const };
  if (insertError) throw insertError;

  try {
    const result = await runOpportunitySearch(defaultOpportunityCriteria);
    if ("agent_error" in result.brief && result.brief.agent_error) throw new Error(result.brief.agent_error);

    const { data: priorRuns, error: priorError } = await admin.from("opportunity_runs").select("output").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(12);
    if (priorError) throw priorError;
    const priorKeys = new Set((priorRuns || []).flatMap((prior) => {
      const output = prior.output as OpportunityRun["output"];
      return (output.opportunities || []).map(opportunityKey);
    }));
    const opportunities = (result.brief.opportunities || []).filter((opportunity) => !priorKeys.has(opportunityKey(opportunity)));
    const brief = {
      ...result.brief,
      opportunities,
      search_summary: opportunities.length === result.brief.opportunities.length
        ? result.brief.search_summary
        : `${result.brief.search_summary} ${result.brief.opportunities.length - opportunities.length} duplicate role(s) were removed.`,
    };

    const { error: saveError } = await admin.from("opportunity_runs").insert({
      user_id: ownerId,
      input: { ...defaultOpportunityCriteria, automation: "weekly" },
      output: brief,
    });
    if (saveError) throw saveError;

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

    await admin.from("automation_settings").update({ last_run_at: completedAt }).eq("user_id", ownerId);
    return { status: "completed" as const, run: completed as AutomationRun, brief };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automated opportunity search failed.";
    await admin.from("automation_runs").update({ status: "failed", error: message.slice(0, 1200), completed_at: new Date().toISOString() }).eq("id", run.id);
    throw error;
  }
}