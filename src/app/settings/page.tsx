"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Database, KeyRound, RefreshCw, Settings, TriangleAlert, type LucideIcon } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { Badge, PageHeader } from "@/components/ui";

type Health = {
  supabase?: { configured: boolean; urlHost: string | null };
  openai?: { configured: boolean; model: string };
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

export default function SettingsPage() {
  const { firms, contacts, applications, opportunityRuns, researchRuns, activityLog, live, syncStatus } = useCareerData();
  const [health, setHealth] = useState<Health | null>(null);
  const [checkedAt, setCheckedAt] = useState<string>("");

  const checkHealth = async () => {
    const response = await fetch("/api/health", { cache: "no-store" });
    const data = await response.json();
    setHealth(data);
    setCheckedAt(new Date().toLocaleString());
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkHealth().catch(() => setCheckedAt(new Date().toLocaleString()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const counts: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: "Firms", value: firms.length, Icon: Database },
    { label: "Contacts", value: contacts.length, Icon: Activity },
    { label: "Applications", value: applications.length, Icon: CheckCircle2 },
    { label: "Opportunity runs", value: opportunityRuns.length, Icon: RefreshCw },
    { label: "Research runs", value: researchRuns.length, Icon: KeyRound },
    { label: "Completed actions", value: activityLog.length, Icon: Settings },
  ];

  return <>
    <PageHeader eyebrow="Workspace controls" title="Settings" description="Check sync health, API configuration, and current workspace counts." action="Refresh checks" onAction={checkHealth} />
    <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
      <div className="space-y-4">
        <StatusRow label="Supabase sync" ok={live || syncStatus === "active"} detail={live ? `Server sync is active${health?.supabase?.urlHost ? ` through ${health.supabase.urlHost}` : ""}.` : syncStatus === "checking" ? "The browser is checking the server connection." : "The browser could not confirm the server connection."} />
        <StatusRow label="Supabase server env" ok={Boolean(health?.supabase?.configured)} detail={health?.supabase?.configured ? "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present in Vercel." : "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Production."} />
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
        <div className="mt-5 rounded-xl border border-[#e4e9e6] bg-white p-4 text-xs leading-5 text-[#60706a]">
          Remove the old Vercel variables named supabase_URL and service_rolesecret when you have a minute. Keep SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, and OPENAI_MODEL.
        </div>
      </div>
    </div>
  </>;
}

