"use client";

import { useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, ExternalLink, LoaderCircle, Radar, Save, Search, Sparkles, Target } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { Badge, PageHeader } from "@/components/ui";
import { careerProfile, defaultOpportunityCriteria } from "@/lib/career-profile";

type Opportunity = {
  firm_name: string;
  role_title: string;
  city: string;
  category: string;
  fit_score: number;
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
    `${opportunity.firm_name} | Fit ${opportunity.fit_score}/100 | ${opportunity.why_fit}`,
    `Source: ${opportunity.source_title} (${opportunity.source_url})`,
    `Next step: ${opportunity.next_step}`,
    `Talking points: ${opportunity.talking_points?.join("; ") || "None returned"}`,
    `Risks: ${opportunity.risks?.join("; ") || "None returned"}`,
    `Search criteria: roles=${criteria.target_roles}; markets=${criteria.target_markets}; themes=${criteria.asset_classes}; company types=${criteria.company_types}`,
  ].join("\n");
}

export default function OpportunitiesPage() {
  const { firms, add } = useCareerData();
  const [form, setForm] = useState(defaultOpportunityCriteria);
  const [brief, setBrief] = useState<OpportunityBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const run = async () => {
    setLoading(true);
    const response = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setBrief(data);
    setLoading(false);
  };

  const saveOpportunity = async (opportunity: Opportunity) => {
    const firmName = opportunity.firm_name.trim();
    const existingFirm = firms.find((firm) => firm.name.toLowerCase() === firmName.toLowerCase());
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
    setSaved((current) => [...current, `${opportunity.firm_name}-${opportunity.role_title}`]);
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
          <label className="block text-xs font-extrabold">Target roles<textarea className="input mt-2 min-h-20 text-sm leading-6" value={form.target_roles} onChange={(e)=>field("target_roles",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Target markets<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.target_markets} onChange={(e)=>field("target_markets",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Asset classes / themes<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.asset_classes} onChange={(e)=>field("asset_classes",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Company types<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.company_types} onChange={(e)=>field("company_types",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Must haves<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.must_haves} onChange={(e)=>field("must_haves",e.target.value)}/></label>
          <label className="block text-xs font-extrabold">Avoid<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.avoid} onChange={(e)=>field("avoid",e.target.value)}/></label>
        </div>
        <button onClick={run} className="btn-primary mt-5 w-full text-sm" disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" size={16}/> : <Search size={16}/>} Find opportunities
        </button>
      </div>

      <div>
        {loading ? <div className="card grid min-h-[460px] place-items-center p-8 text-center">
          <div><LoaderCircle className="mx-auto animate-spin text-[#164c3a]" size={30}/><div className="mt-4 text-sm font-extrabold">Searching the market...</div><div className="mt-1 text-xs text-[#7a8781]">The agent is scanning roles, career pages, and fit signals.</div></div>
        </div> : !brief ? <div className="card grid min-h-[460px] place-items-center p-8 text-center">
          <div><Target className="mx-auto text-[#77a392]" size={30}/><div className="mt-4 text-sm font-extrabold">Describe what you want</div><div className="mt-1 max-w-sm text-xs leading-5 text-[#7a8781]">The agent will return specific roles, fit scores, risks, next steps, and source links.</div></div>
        </div> : <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold"><Sparkles size={16} className="text-[#164c3a]"/> Search summary</div>
            <p className="text-sm leading-6 text-[#5f6d67]">{brief.search_summary}</p>
            <div className="mt-3 text-xs font-bold text-[#7a8781]">{brief.demo ? "Demo results | add OPENAI_API_KEY on Vercel for live search" : "Live opportunity search"}</div>
            {brief.agent_error && <div className="mt-4 rounded-xl border border-[#f1d4a8] bg-[#fff8ed] p-3 text-xs leading-5 text-[#8a6120]">
              Live OpenAI search failed. Check API billing, usage limits, or model access in the OpenAI dashboard, then try again. Fallback results are shown below.
            </div>}
          </div>

          <div className="grid gap-4">
            {brief.opportunities?.length ? brief.opportunities.map((opportunity) => {
              const key = `${opportunity.firm_name}-${opportunity.role_title}`;
              const isSaved = saved.includes(key);
              return <div key={key} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold tracking-[-.02em]">{opportunity.role_title}</h2><Badge tone={opportunity.fit_score >= 85 ? "lime" : opportunity.fit_score >= 75 ? "green" : "gray"}>{opportunity.fit_score}/100 fit</Badge></div>
                    <div className="mt-1 text-sm font-bold text-[#66736d]">{opportunity.firm_name} | {opportunity.city} | {opportunity.category}</div>
                  </div>
                  <div className="flex gap-2">
                    <a className="btn-secondary text-xs" href={opportunity.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Source</a>
                    <button onClick={()=>saveOpportunity(opportunity)} disabled={isSaved} className="btn-primary text-xs">{isSaved ? <Check size={14}/> : <Save size={14}/>} {isSaved ? "Saved" : "Save"}</button>
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
