"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArchiveX, ExternalLink, Inbox, LoaderCircle, Save, Sparkles } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import type { AutomationResult } from "@/lib/types";

function score(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" ? value : null;
}

export default function AutomationInboxPage() {
  const [results, setResults] = useState<AutomationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/automation/inbox", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inbox could not be loaded.");
      setResults(data.results || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inbox could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const newCount = useMemo(() => results.filter((item) => item.status === "new").length, [results]);

  const act = async (id: string, action: "save" | "dismiss") => {
    setActing(`${id}:${action}`);
    try {
      const response = await fetch("/api/automation/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inbox action failed.");
      setResults((current) => current.map((item) => item.id === id ? { ...item, status: action === "save" ? "saved" : "dismissed", reviewed_at: new Date().toISOString() } : item));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inbox action failed.");
    } finally {
      setActing("");
    }
  };

  return <>
    <PageHeader eyebrow="Automation review" title="Automation Inbox" description="Review new roles before they become permanent firms or applications." action="Refresh inbox" onAction={load} />
    <div className="mb-5 flex flex-wrap items-center gap-2"><Badge tone={newCount ? "amber" : "green"}>{newCount} new</Badge><span className="text-xs text-[#718079]">Saving creates or links the firm and adds the role to Applications as a Prospect.</span></div>
    {error && <div className="mb-5 rounded-xl border border-[#f1d4a8] bg-[#fff8ed] px-4 py-3 text-sm text-[#8a6120]">{error}</div>}
    {loading ? <div className="card flex items-center justify-center gap-2 p-10 text-sm text-[#718079]"><LoaderCircle className="animate-spin" size={17}/>Loading inbox...</div> :
      results.length === 0 ? <div className="card p-10 text-center"><Inbox className="mx-auto mb-3 text-[#718079]"/><div className="font-extrabold">No automation results yet</div><p className="mt-2 text-sm text-[#718079]">Run the opportunity automation from Settings after applying the database migration.</p></div> :
      <div className="space-y-3">{results.map((item) => {
        const payload = item.payload || {};
        const url = typeof payload.source_url === "string" ? payload.source_url : "";
        return <article key={item.id} className={`card p-5 ${item.status !== "new" ? "opacity-65" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2"><Sparkles size={15} className="text-[#164c3a]"/><Badge tone={item.status === "new" ? "amber" : item.status === "saved" ? "green" : "gray"}>{item.status}</Badge><span className="text-[11px] text-[#718079]">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</span></div>
              <h2 className="text-base font-extrabold">{item.title}</h2>
              <p className="mt-1 text-sm text-[#60706a]">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#52645d]">
                {score(payload, "fit_score") !== null && <span className="rounded-lg bg-[#f0f5f2] px-2 py-1">Fit {score(payload, "fit_score")}</span>}
                {score(payload, "timing_score") !== null && <span className="rounded-lg bg-[#f0f5f2] px-2 py-1">Timing {score(payload, "timing_score")}</span>}
                {typeof payload.opportunity_type === "string" && <span className="rounded-lg bg-[#f0f5f2] px-2 py-1">{payload.opportunity_type}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {url && <a className="btn-secondary text-xs" href={url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Open source</a>}
              {item.status === "new" && <>
                <button className="btn-secondary text-xs" disabled={Boolean(acting)} onClick={() => act(item.id, "dismiss")}>{acting === `${item.id}:dismiss` ? <LoaderCircle className="animate-spin" size={14}/> : <ArchiveX size={14}/>}Dismiss</button>
                <button className="btn-primary text-xs" disabled={Boolean(acting)} onClick={() => act(item.id, "save")}>{acting === `${item.id}:save` ? <LoaderCircle className="animate-spin" size={14}/> : <Save size={14}/>}Save to pipeline</button>
              </>}
            </div>
          </div>
        </article>;
      })}</div>}
  </>;
}
