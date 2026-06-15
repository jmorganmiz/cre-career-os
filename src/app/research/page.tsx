"use client";

import { useState } from "react";
import { AlertTriangle, Building2, Check, Copy, ExternalLink, LoaderCircle, MessageSquareText, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/ui";

type Brief = { firm_summary: string; fit: string; questions: string[]; linkedin_message: string; talking_points: string[]; red_flags: string[]; sources: { title: string; url: string }[]; demo?: boolean };

export default function ResearchPage() {
  const [form, setForm] = useState({ firm_name: "VTS", website_text: "", contact_bio: "", job_description: "" });
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBrief(await response.json()); setLoading(false);
  };
  const field = (key: keyof typeof form, value: string) => setForm(x=>({...x,[key]:value}));
  const sections = brief ? [
    {icon:Building2,title:"Firm summary",text:brief.firm_summary},
    {icon:Target,title:"Why this firm fits",text:brief.fit},
    {icon:MessageSquareText,title:"Networking questions",bullets:brief.questions},
    {icon:Sparkles,title:"LinkedIn message",text:brief.linkedin_message},
    {icon:Check,title:"Application talking points",bullets:brief.talking_points},
    {icon:AlertTriangle,title:"Research further",bullets:brief.red_flags},
  ] : [];
  return <><PageHeader eyebrow="AI workspace" title="Research agent" description="Use live web research plus your context to build an actionable firm brief." />
  <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
    <div className="card h-fit p-5"><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9efe7] text-[#164c3a]"><Sparkles size={18}/></span><div><div className="text-sm font-extrabold">Run firm researcher</div><div className="mt-0.5 text-xs text-[#7a8781]">Researches and drafts; you approve actions</div></div></div>
      <div className="space-y-4"><label className="block text-xs font-extrabold">Firm name<input className="input mt-2 text-sm" value={form.firm_name} onChange={e=>field("firm_name",e.target.value)}/></label><label className="block text-xs font-extrabold">Firm website text<textarea className="input mt-2 min-h-24 resize-y text-sm leading-6" value={form.website_text} onChange={e=>field("website_text",e.target.value)} placeholder="Paste relevant website text or leave blank for web research."/></label><label className="block text-xs font-extrabold">Contact bio<textarea className="input mt-2 min-h-24 resize-y text-sm leading-6" value={form.contact_bio} onChange={e=>field("contact_bio",e.target.value)}/></label><label className="block text-xs font-extrabold">Job description<textarea className="input mt-2 min-h-32 resize-y text-sm leading-6" value={form.job_description} onChange={e=>field("job_description",e.target.value)}/></label></div>
      <button onClick={run} className="btn-primary mt-5 w-full text-sm" disabled={loading||!form.firm_name}>{loading?<LoaderCircle className="animate-spin" size={16}/>:<Sparkles size={16}/>}Run research agent</button>
    </div>
    <div>{loading?<div className="card grid min-h-[420px] place-items-center p-8 text-center"><div><LoaderCircle className="mx-auto animate-spin text-[#164c3a]" size={28}/><div className="mt-4 text-sm font-extrabold">Researching {form.firm_name}...</div><div className="mt-1 text-xs text-[#7a8781]">Reviewing the firm, role, and networking angles.</div></div></div>:!brief?<div className="card grid min-h-[420px] place-items-center p-8 text-center"><div><Sparkles className="mx-auto text-[#77a392]" size={28}/><div className="mt-4 text-sm font-extrabold">Your research brief will appear here</div><div className="mt-1 max-w-xs text-xs leading-5 text-[#7a8781]">Add a firm and any context you have, then run the agent.</div></div></div>:<div className="space-y-4"><div className="flex items-center justify-between"><div><div className="text-sm font-extrabold">{form.firm_name} research brief</div><div className="mt-1 text-xs text-[#7a8781]">{brief.demo?"Demo output | add OPENAI_API_KEY for live research":"Live agent research"}</div></div><button onClick={()=>navigator.clipboard.writeText(JSON.stringify(brief,null,2))} className="btn-secondary text-xs"><Copy size={14}/>Copy brief</button></div>{sections.map(({icon:Icon,title,text,bullets})=><div key={title} className="card p-5"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Icon size={16} className="text-[#164c3a]"/>{title}</div>{text&&<p className="text-sm leading-6 text-[#5f6d67]">{text}</p>}{bullets&&<ul className="space-y-2">{bullets.map(b=><li key={b} className="flex gap-2 text-sm leading-6 text-[#5f6d67]"><span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-[#78a18f]"/>{b}</li>)}</ul>}</div>)}{brief.sources?.length>0&&<div className="card p-5"><div className="mb-3 text-sm font-extrabold">Sources</div>{brief.sources.map(s=><a className="mb-2 flex items-center gap-2 text-xs font-bold text-[#164c3a]" href={s.url} target="_blank" rel="noreferrer" key={s.url}><ExternalLink size={13}/>{s.title}</a>)}</div>}</div>}</div>
  </div></>;
}
