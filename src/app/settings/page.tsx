"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CalendarClock, CheckCircle2, Clock3, Database, DollarSign, KeyRound, LoaderCircle, Play, RefreshCw, Settings, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { Badge, PageHeader } from "@/components/ui";
import type { AutomationRun, AutomationSettings } from "@/lib/types";

type Health = {
  supabase?: { configured: boolean; urlHost: string | null };
  openai?: { configured: boolean; model: string };
  privateDeployment?: { acknowledged: boolean; ownerConfigured: boolean; ownerSuffix: string | null };
};

type AutomationSnapshot = {
  settings: AutomationSettings;
  runs: AutomationRun[];
  budget: { limit: number; reserved: number; estimated: number; remaining: number };
  schedule: string;
  currentRunKey: string;
};

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e4e9e6] bg-white p-4">
    <div className="flex items-center gap-3">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${ok ? "bg-[#d9efe7] text-[#164c3a]" : "bg-[#fff1d8] text-[#8a6120]"}`}>{ok ? <CheckCircle2 size={17}/> : <TriangleAlert size={17}/>}</span>
      <div><div className="text-sm font-extrabold">{label}</div><div className="mt-1 text-xs text-[#718079]">{detail}</div></div>
    </div>
    <Badge tone={ok ? "green" : "amber"}>{ok ? "Connected" : "Needs attention"}</Badge>
  </div>;
}

function runLabel(status: AutomationRun["status"]) {
  if (status === "completed") return "Completed";
  if (status === "failed") return "Failed";
  if (status === "running") return "Running";
  return "Skipped";
}

export default function SettingsPage() {
  const { firms, contacts, applications, opportunityRuns, researchRuns, activityLog, live, syncStatus } = useCareerData();
  const [health, setHealth] = useState<Health | null>(null);
  const [automation, setAutomation] = useState<AutomationSnapshot | null>(null);
  const [automationError, setAutomationError] = useState("");
  const [checkedAt, setCheckedAt] = useState("");
  const [actionLoading, setActionLoading] = useState<"toggle" | "run" | "">("");

  const checkHealth = useCallback(async () => {
    const response = await fetch("/api/health", { cache: "no-store" });
    const data = await response.json();
    setHealth(data);
    setCheckedAt(new Date().toLocaleString());
  }, []);

  const loadAutomation = useCallback(async () => {
    const response = await fetch("/api/automation", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      const detail = data.error || "Automation status could not be loaded.";
      setAutomationError(detail);
      throw new Error(detail);
    }
    setAutomation(data);
    setAutomationError("");
  }, []);

  const refresh = useCallback(async () => {
    await Promise.allSettled([checkHealth(), loadAutomation()]);
    setCheckedAt(new Date().toLocaleString());
  }, [checkHealth, loadAutomation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh().catch(() => setCheckedAt(new Date().toLocaleString()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const automationAction = async (action: "setEnabled" | "runNow", enabled?: boolean) => {
    setActionLoading(action === "setEnabled" ? "toggle" : "run");
    try {
      const response = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Automation update failed.");
      setAutomation(action === "runNow" ? data.snapshot : data);
      setAutomationError("");
    } catch (error) {
      setAutomationError(error instanceof Error ? error.message : "Automation update failed.");
    } finally {
      setActionLoading("");
    }
  };

  const counts: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: "Firms", value: firms.length, Icon: Database },
    { label: "Contacts", value: contacts.length, Icon: Activity },
    { label: "Applications", value: applications.length, Icon: CheckCircle2 },
    { label: "Opportunity runs", value: opportunityRuns.length, Icon: RefreshCw },
    { label: "Research runs", value: researchRuns.length, Icon: KeyRound },
    { label: "Completed actions", value: activityLog.length, Icon: Settings },
  ];
  const budgetPercent = automation ? Math.min(100, automation.budget.reserved / automation.budget.limit * 100) : 0;

  return <>
    <PageHeader eyebrow="Workspace controls" title="Settings" description="Manage daily automation, the review inbox, API budget, sync health, and workspace status." action="Refresh checks" onAction={refresh} />

    <section className="mb-6 border-y border-[#dfe6e2] bg-white px-5 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#d9efe7] text-[#164c3a]"><CalendarClock size={20}/></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-extrabold">Daily opportunity automation</h2><Badge tone={automation?.settings.enabled ? "green" : "gray"}>{automation?.settings.enabled ? "Enabled" : "Paused"}</Badge></div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#60706a]">Runs the 2027 opportunity search daily, removes roles already found, and sends new results to the Automation Inbox for review.</p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-xs font-extrabold text-[#33423c]">
          <input className="h-4 w-4 accent-[#164c3a]" type="checkbox" checked={Boolean(automation?.settings.enabled)} disabled={!automation || Boolean(actionLoading)} onChange={(event) => automationAction("setEnabled", event.target.checked)} />
          {actionLoading === "toggle" ? "Saving..." : "Automate daily"}
        </label>
      </div>

      {automationError && <div className="mt-5 rounded-lg border border-[#f1d4a8] bg-[#fff8ed] px-4 py-3 text-xs leading-5 text-[#8a6120]">{automationError.includes("automation_") ? "Automation needs its Supabase tables. Run supabase/automation.sql in the Supabase SQL Editor, then refresh this page." : automationError}</div>}

      <div className="mt-6 grid gap-0 border-y border-[#e4e9e6] md:grid-cols-3 md:divide-x md:divide-[#e4e9e6]">
        <div className="py-4 md:pr-5"><div className="flex items-center gap-2 text-xs font-bold text-[#718079]"><DollarSign size={14}/>Monthly hard limit</div><div className="mt-2 text-2xl font-extrabold">${automation?.budget.limit ?? 35}</div><div className="mt-1 text-[11px] text-[#718079]">Fixed server-side</div></div>
        <div className="border-t border-[#e4e9e6] py-4 md:border-t-0 md:px-5"><div className="flex items-center gap-2 text-xs font-bold text-[#718079]"><ShieldCheck size={14}/>Reserved this month</div><div className="mt-2 text-2xl font-extrabold">${automation?.budget.reserved.toFixed(2) ?? "0.00"}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7ece9]"><div className="h-full rounded-full bg-[#54a57f]" style={{ width: `${budgetPercent}%` }}/></div></div>
        <div className="border-t border-[#e4e9e6] py-4 md:border-t-0 md:pl-5"><div className="flex items-center gap-2 text-xs font-bold text-[#718079]"><Clock3 size={14}/>Schedule</div><div className="mt-2 text-sm font-extrabold">{automation?.schedule || "Daily at 14:00 UTC"}</div><div className="mt-1 text-[11px] text-[#718079]">One scheduled run per day</div></div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs leading-5 text-[#60706a]">Only scheduled runs reserve $7 against the limit. Manual Run now and Opportunity Finder searches are uncapped. Estimated API usage this month: <strong>${automation?.budget.estimated.toFixed(4) ?? "0.0000"}</strong>. Provider billing remains the source of truth.</div>
        <button className="btn-primary text-xs" disabled={!automation || Boolean(actionLoading)} onClick={() => automationAction("runNow")}>
          {actionLoading === "run" ? <LoaderCircle className="animate-spin" size={15}/> : <Play size={15}/>} Run now
        </button>
      </div>

      {automation?.runs.length ? <div className="mt-6 border-t border-[#e4e9e6] pt-5">
        <div className="mb-3 text-xs font-extrabold text-[#33423c]">Recent automated runs</div>
        <div className="divide-y divide-[#e4e9e6]">
          {automation.runs.slice(0, 5).map((run) => <div key={run.id || run.run_key} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
            <div><span className="font-extrabold text-[#33423c]">{run.run_key.includes("-manual-") ? "Manual search" : run.run_key}</span><span className="ml-2 text-[#718079]">{run.opportunity_count ?? 0} new roles</span></div>
            <div className="flex items-center gap-3"><span className="text-[#718079]">${Number(run.estimated_cost_usd || 0).toFixed(4)} estimated</span><Badge tone={run.status === "completed" ? "green" : run.status === "failed" ? "amber" : "gray"}>{runLabel(run.status)}</Badge></div>
          </div>)}
        </div>
      </div> : null}
    </section>

    <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
      <div className="space-y-4">
        <StatusRow label="Supabase sync" ok={live || syncStatus === "active"} detail={live ? `Server sync is active${health?.supabase?.urlHost ? ` through ${health.supabase.urlHost}` : ""}.` : syncStatus === "checking" ? "The browser is checking the server connection." : "The browser could not confirm the server connection."} />
        <StatusRow label="Supabase server env" ok={Boolean(health?.supabase?.configured)} detail={health?.supabase?.configured ? "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present in Vercel." : "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Production."} />
        <StatusRow label="Private deployment" ok={Boolean(health?.privateDeployment?.acknowledged && health?.privateDeployment?.ownerConfigured)} detail={health?.privateDeployment?.acknowledged && health?.privateDeployment?.ownerConfigured ? `Vercel protection acknowledged. Owner id ends in ${health.privateDeployment.ownerSuffix}.` : "Enable Vercel Deployment Protection, then set CAREEROS_PRIVATE_DEPLOYMENT_ACK=true and CAREEROS_OWNER_ID."} />
        <StatusRow label="OpenAI agent env" ok={Boolean(health?.openai?.configured)} detail={health?.openai?.configured ? `OPENAI_API_KEY is present. Model: ${health?.openai?.model}.` : "Add OPENAI_API_KEY in Vercel Production for live research and opportunity search."} />
      </div>
      <div className="card h-fit p-5">
        <div className="mb-4 flex items-center justify-between"><div><div className="text-sm font-extrabold">Record counts</div><div className="mt-1 text-xs text-[#718079]">{checkedAt ? `Last checked ${checkedAt}` : "Checking health..."}</div></div><Badge tone={live ? "green" : "amber"}>{syncStatus}</Badge></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {counts.map(({ label, value, Icon }) => <div key={label} className="rounded-xl bg-[#f7f9f8] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#718079]"><Icon size={14}/>{label}</div>
            <div className="text-2xl font-extrabold">{value}</div>
          </div>)}
        </div>
      </div>
    </div>
  </>;
}
