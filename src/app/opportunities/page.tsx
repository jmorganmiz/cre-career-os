"use client";

import { useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, ExternalLink, History, LoaderCircle, Radar, Save, Search, Sparkles, Target } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { Badge, PageHeader } from "@/components/ui";
import { careerProfile, defaultOpportunityCriteria } from "@/lib/career-profile";
import type { Application, Firm } from "@/lib/types";

type Opportunity = {
  firm_name: string;
  role_title: string;
  city: string;
  category: string;
  opportunity_type?: string;
  fit_score: number;
  timing_score?: number;
  source_quality_score?: number;
  career_fit_score?: number;
  why_fit: string;
  source_url: string;
  source_title: string;
  next_step: string;
  talking_points: string[];
  risks: string[];
};

type OpportunityBrief = {
  search_summary: string;
  strategy: string[];
  opportunities: Opportunity[];
  searches_to_run_next: string[];
  demo?: boolean;
  agent_error?: string;
};

function followUpDateForFit(score: number) {
  const date = new Date();
  date.setDate(date.getDate() + (score >= 85 ? 1 : score >= 75 ? 3 : 7));
  return date.toISOString().slice(0, 10);
}

function buildOpportunityNotes(opportunity: Opportunity, criteria: typeof defaultOpportunityCriteria) {
  return [
    `${opportunity.firm_name} | Fit ${opportunity.fit_score}/100 | Timing ${opportunity.timing_score ?? opportunity.fit_score}/100 | Source ${opportunity.source_quality_score ?? opportunity.fit_score}/100 | Career fit ${opportunity.career_fit_score ?? opportunity.fit_score}/100 | ${opportunity.why_fit}`,
    `Source: ${opportunity.source_title} (${opportunity.source_url})`,
    `Next step: ${opportunity.next_step}`,
    `Talking points: ${opportunity.talking_points?.join("; ") || "None returned"}`,
    `Risks: ${opportunity.risks?.join("; ") || "None returned"}`,
    `Target timing: ${criteria.target_timing}`,
    `Search criteria: type=${criteria.opportunity_type}; path=${criteria.career_path}; roles=${criteria.target_roles}; markets=${criteria.target_markets}; themes=${criteria.asset_classes}; company types=${criteria.company_types}`,
  ].join("\n");
}

function normalizedText(value?: string) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizedUrl(value?: string) {
  if (!value?.trim()) return "";
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

function isGenericCareersUrl(value?: string) {
  const url = normalizedUrl(value);
  if (!url) return true;
  try {
    const path = new URL(url).pathname.replace(/\/$/, "");
    return /\/(careers?|jobs?|opportunities)$/i.test(path);
  } catch {
    return false;
  }
}

function isOpportunitySaved(opportunity: Opportunity, applications: Application[], firms: Firm[]) {
  const firm = firms.find((item) => normalizedText(item.name) === normalizedText(opportunity.firm_name));
  const role = normalizedText(opportunity.role_title);
  const url = normalizedUrl(opportunity.source_url);
  return applications.some((application) => {
    const sameRoleAtFirm = Boolean(firm?.id && application.firm_id === firm.id && normalizedText(application.role_title) === role);
    const sameSpecificUrl = Boolean(url && !isGenericCareersUrl(url) && normalizedUrl(application.job_url) === url);
    return sameRoleAtFirm || sameSpecificUrl;
  });
}

export default function OpportunitiesPage() {
  const { firms, applications, opportunityRuns, add, addOpportunityRun } = useCareerData();
  const [form, setForm] = useState(defaultOpportunityCriteria);
  const [brief, setBrief] = useState<OpportunityBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const run = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      setBrief(data);
      addOpportunityRun(form, data).catch((error) => console.error("Could not save opportunity run", error));
    } finally {
      setLoading(false);
    }
  };

  const restoreRun = (run: typeof opportunityRuns[number]) => {
    setForm((current) => ({ ...current, ...run.input }));
    setBrief(run.output as OpportunityBrief);
  };

  const saveOpportunity = async (opportunity: Opportunity) => {
    const key = `${opportunity.firm_name}-${opportunity.role_title}`;
    if (isOpportunitySaved(opportunity, applications, firms)) {
      setSaved((current) => current.includes(key) ? current : [...current, key]);
      return;
    }

    setSaving(key);
    setSaveError("");
    try {
      const firmName = opportunity.firm_name.trim();
      const existingFirm = firms.find((firm) => normalizedText(firm.name) === normalizedText(firmName));
      const linkedFirm = existingFirm || await add("firms", {
        name: firmName,
        city: opportunity.city,
        category: opportunity.category,
        priority: opportunity.fit_score >= 85 ? "Tier 1" : "Tier 2",
        careers_url: opportunity.source_url,
        why_interested: opportunity.why_fit,
      });

      await add("applications", {
        firm_id: linkedFirm.id,
        role_title: opportunity.role_title,
        city: opportunity.city,
        job_url: opportunity.source_url,
        status: "Saved",
        interview_stage: `Opportunity found | ${opportunity.fit_score}/100 fit`,
        follow_up_at: followUpDateForFit(opportunity.fit_score),
        notes: buildOpportunityNotes(opportunity, form),
      });
      setSaved((current) => current.includes(key) ? current : [...current, key]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The opportunity could not be saved to Supabase.");
    } finally {
      setSaving(null);
    }
  };

  return <>
    <PageHeader eyebrow="Agentic search" title="Opportunity finder" description={`Personalized for ${careerProfile.name}'s AI-enabled multifamily investor path.`} />
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <div className="card h-fit p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9efe7] text-[#164c3a]"><Radar size={18}/></span>
          <div><div className="text-sm font-extrabold">Opportunity brief</div><div className="mt-0.5 text-xs text-[#7a8781]">Current web search, scored for your goals</div></div>
        </div>
        <div className="mb-5 rounded-2xl border border-[#e4e9e6] bg-[#f7f9f8] p-4">
          <div className="text-xs font-extrabold text-[#164c3a]">North Star</div>
          <p className="mt-2 text-xs leading-5 text-[#60706a]">{careerProfile.northStar}</p>
        </div>
        <div className="space-y-4">
          <label className="block text-xs font-extrabold">Opportunity type<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.opportunity_type} onChange={(e)=>field("opportunity_type",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Career path<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.career_path} onChange={(e)=>field("career_path",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Target roles<textarea className="input mt-2 min-h-20 text-sm leading-6" value={form.target_roles} onChange={(e)=>field("target_roles",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Target markets<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.target_markets} onChange={(e)=>field("target_markets",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Asset classes / themes<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.asset_classes} onChange={(e)=>field("asset_classes",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Company types<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.company_types} onChange={(e)=>field("company_types",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Target timing<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.target_timing} onChange={(e)=>field("target_timing",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Must haves<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.must_haves} onChange={(e)=>field("must_haves",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Avoid<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.avoid} onChange={(e)=>field("avoid",e.target.value)}/></label>
        </div>
        <button onClick={run} className="btn-primary mt-5 w-full text-sm" disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" size={16}/> : <Search size={16}/>} Find opportunities
        </button>
        {opportunityRuns.length > 0 && <div className="mt-5 border-t border-[#e4e9e6] pt-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-[#164c3a]"><History size={14}/> Recent runs</div>
          <div className="space-y-2">
            {opportunityRuns.slice(0, 4).map((run) => <button key={run.id} onClick={() => restoreRun(run)} className="w-full rounded-xl border border-[#e4e9e6] bg-white p-3 text-left hover:bg-[#f7f9f8]">
              <div className="text-xs font-extrabold text-[#24312c]">{run.input.target_roles || "Opportunity search"}</div>
              <div className="mt-1 text-[11px] font-bold text-[#7a8781]">{run.input.target_markets || "Any market"} | {run.output.opportunities?.length || 0} roles | {run.created_at?.slice(0, 10) || "Today"}</div>
            </button>)}
          </div>
        </div>}
      </div>

      <div>
        {loading ? <div className="card grid min-h-[460px] place-items-center p-8 text-center">
          <div><LoaderCircle className="mx-auto animate-spin text-[#164c3a]" size={30}/><div className="mt-4 text-sm font-extrabold">Searching the market...</div><div className="mt-1 text-xs text-[#7a8781]">The agent is scanning roles, career pages, and fit signals.</div></div>
        </div> : !brief ? <div className="card grid min-h-[460px] place-items-center p-8 text-center">
          <div><Target className="mx-auto text-[#77a392]" size={30}/><div className="mt-4 text-sm font-extrabold">Describe what you want</div><div className="mt-1 max-w-sm text-xs leading-5 text-[#7a8781]">The agent will return Spring/Summer 2027 roles with fit scores, risks, next steps, and source links.</div></div>
        </div> : <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold"><Sparkles size={16} className="text-[#164c3a]"/> Search summary</div>
            <p className="text-sm leading-6 text-[#5f6d67]">{brief.search_summary}</p>
            <div className="mt-3 text-xs font-bold text-[#7a8781]">{brief.demo ? "Demo results | add OPENAI_API_KEY on Vercel for live search" : "Live opportunity search"}</div>
            {brief.agent_error && <div className="mt-4 rounded-xl border border-[#f1d4a8] bg-[#fff8ed] p-3 text-xs leading-5 text-[#8a6120]">
              Live OpenAI search failed. Check API billing, usage limits, or model access in the OpenAI dashboard, then try again. Fallback results are shown below.
            </div>}
          </div>

          {saveError && <div className="rounded-xl border border-[#f1d4a8] bg-[#fff8ed] px-4 py-3 text-xs font-bold text-[#8a6120]">Save failed: {saveError}</div>}

          <div className="grid gap-4">
            {brief.opportunities?.length ? brief.opportunities.map((opportunity) => {
              const key = `${opportunity.firm_name}-${opportunity.role_title}`;
              const isSaved = saved.includes(key) || isOpportunitySaved(opportunity, applications, firms);
              const isSaving = saving === key;
              return <div key={key} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold tracking-[-.02em]">{opportunity.role_title}</h2><Badge tone={opportunity.fit_score >= 85 ? "lime" : opportunity.fit_score >= 75 ? "green" : "gray"}>{opportunity.fit_score}/100 fit</Badge></div>
                    <div className="mt-1 text-sm font-bold text-[#66736d]">{opportunity.firm_name} | {opportunity.city} | {opportunity.category}</div>
                    <div className="mt-3 flex flex-wrap gap-2"><Badge tone="gray">{opportunity.opportunity_type || "2027 early career"}</Badge><Badge tone="blue">Timing {opportunity.timing_score ?? opportunity.fit_score}</Badge><Badge tone="green">Source {opportunity.source_quality_score ?? opportunity.fit_score}</Badge><Badge tone="lime">Career {opportunity.career_fit_score ?? opportunity.fit_score}</Badge></div>
                  </div>
                  <div className="flex gap-2">
                    <a className="btn-secondary text-xs" href={opportunity.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Source</a>
                    <button onClick={()=>saveOpportunity(opportunity)} disabled={isSaved || isSaving} className="btn-primary text-xs">{isSaving ? <LoaderCircle className="animate-spin" size={14}/> : isSaved ? <Check size={14}/> : <Save size={14}/>} {isSaving ? "Saving" : isSaved ? "Saved" : "Save"}</button>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#5f6d67]">{opportunity.why_fit}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-[#f7f9f8] p-4"><div className="mb-2 text-xs font-extrabold text-[#164c3a]">Next step</div><p className="text-xs leading-5 text-[#60706a]">{opportunity.next_step}</p></div>
                  <div className="rounded-xl bg-[#f7f9f8] p-4"><div className="mb-2 text-xs font-extrabold text-[#164c3a]">Watch-outs</div><ul className="space-y-1">{opportunity.risks?.map((risk)=><li key={risk} className="text-xs leading-5 text-[#60706a]">- {risk}</li>)}</ul></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">{opportunity.talking_points?.map((point)=><span key={point} className="rounded-full bg-[#eef4f1] px-3 py-1 text-[11px] font-bold text-[#557166]">{point}</span>)}</div>
              </div>;
            }) : <div className="card p-6 text-center"><div className="text-sm font-extrabold">No opportunities returned</div><p className="mt-2 text-xs leading-5 text-[#7a8781]">The agent response did not include opportunity cards. Try a narrower search or check the API status.</p></div>}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold"><BriefcaseBusiness size={16} className="text-[#164c3a]"/> Searches to run next</div>
            <div className="space-y-2">{brief.searches_to_run_next?.map((query)=><div key={query} className="flex items-center justify-between rounded-xl bg-[#f7f9f8] px-3 py-2 text-xs font-bold text-[#60706a]">{query}<ArrowUpRight size={13}/></div>)}</div>
          </div>
        </div>}
      </div>
    </div>
  </>;
}

