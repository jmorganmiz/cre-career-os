"use client";

import { useState } from "react";
import { Check, ExternalLink, LoaderCircle, Search, Send, UserRound, UsersRound } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { Badge, PageHeader } from "@/components/ui";

type Person = {
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  company: string;
  location?: string;
  profile_url?: string;
  source_title?: string;
  why_reach_out: string;
  outreach_angle: string;
  message_draft: string;
  confidence: number;
};

type PeopleResponse = {
  search_summary: string;
  people: Person[];
  searches_to_run_next: string[];
  caveats: string[];
  demo?: boolean;
  agent_error?: string;
};

export default function PeoplePage() {
  const { firms, contacts, add } = useCareerData();
  const [form, setForm] = useState({ firm_name: firms[0]?.name || "", role_focus: "analysts, associates, acquisitions, capital markets, asset management, recruiters", location: "Dallas, Charleston, Charlotte, San Diego, New York", seniority: "analyst, associate, recruiter" });
  const [result, setResult] = useState<PeopleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const run = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setResult(await response.json());
    } finally {
      setLoading(false);
    }
  };

  const savePerson = async (person: Person) => {
    const firm = firms.find((item) => item.name.toLowerCase() === person.company.toLowerCase()) || firms.find((item) => item.name.toLowerCase() === form.firm_name.toLowerCase());
    await add("contacts", {
      firm_id: firm?.id,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      linkedin_url: person.profile_url,
      status: "Target",
      relationship_score: Math.min(85, Math.max(35, person.confidence || 50)),
      notes: [`Why reach out: ${person.why_reach_out}`, `Outreach angle: ${person.outreach_angle}`, `Draft: ${person.message_draft}`, `Source: ${person.source_title || person.profile_url || "Public web search"}`].join("\n"),
    });
    setSaved((current) => [...current, `${person.full_name}-${person.company}`]);
  };

  return <>
    <PageHeader eyebrow="Public profile search" title="People Finder" description="Find public LinkedIn-style profiles and save outreach targets into Contacts." action="Find people" onAction={run} />
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <div className="card h-fit p-5">
        <div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d9efe7] text-[#164c3a]"><UsersRound size={21}/></span><div><div className="text-sm font-extrabold">Reachout targets</div><div className="mt-1 text-xs text-[#718079]">Public web search, then verify manually</div></div></div>
        <div className="space-y-4">
          <label className="block text-xs font-extrabold">Firm or company<input className="input mt-2 text-sm" value={form.firm_name} onChange={(event) => field("firm_name", event.target.value)} placeholder="Greystar, Walker & Dunlop, VTS..." /></label>
          <label className="block text-xs font-extrabold">Role focus<textarea className="input mt-2 min-h-20 text-sm leading-6" value={form.role_focus} onChange={(event) => field("role_focus", event.target.value)} /></label>
          <label className="block text-xs font-extrabold">Location focus<textarea className="input mt-2 min-h-16 text-sm leading-6" value={form.location} onChange={(event) => field("location", event.target.value)} /></label>
          <label className="block text-xs font-extrabold">Seniority<input className="input mt-2 text-sm" value={form.seniority} onChange={(event) => field("seniority", event.target.value)} /></label>
        </div>
        <button onClick={run} disabled={loading} className="btn-primary mt-5 w-full text-sm">{loading ? <LoaderCircle className="animate-spin" size={16}/> : <Search size={16}/>}Find people</button>
        <div className="mt-5 rounded-xl border border-[#e4e9e6] bg-[#f7f9f8] p-4 text-xs leading-5 text-[#60706a]">This does not log into LinkedIn or scrape private pages. It uses public web search and gives you targets to verify before outreach.</div>
      </div>

      <div>
        {loading ? <div className="card grid min-h-[460px] place-items-center p-8 text-center"><div><LoaderCircle className="mx-auto animate-spin text-[#164c3a]" size={30}/><div className="mt-4 text-sm font-extrabold">Finding public profiles...</div><div className="mt-1 text-xs text-[#7a8781]">Looking for analysts, associates, recruiters, and useful referral paths.</div></div></div> : !result ? <div className="card grid min-h-[460px] place-items-center p-8 text-center"><div><UserRound className="mx-auto text-[#77a392]" size={30}/><div className="mt-4 text-sm font-extrabold">Find names to reach out to</div><div className="mt-1 max-w-sm text-xs leading-5 text-[#7a8781]">Start with a target firm, then save useful people directly into Contacts.</div></div></div> : <div className="space-y-4">
          <div className="card p-5"><div className="mb-2 flex items-center justify-between"><div className="text-sm font-extrabold">Search summary</div><Badge tone={result.demo ? "amber" : "green"}>{result.demo ? "Fallback" : "Live"}</Badge></div><p className="text-sm leading-6 text-[#5f6d67]">{result.search_summary}</p>{result.agent_error && <div className="mt-4 rounded-xl border border-[#f1d4a8] bg-[#fff8ed] p-3 text-xs leading-5 text-[#8a6120]">Live people search had an issue, so fallback guidance is shown.</div>}</div>
          <div className="grid gap-4">{result.people?.map((person) => {
            const key = `${person.full_name}-${person.company}`;
            const isSaved = saved.includes(key) || contacts.some((contact) => `${contact.first_name} ${contact.last_name}`.toLowerCase() === person.full_name.toLowerCase());
            return <div key={key} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold tracking-[-.02em]">{person.full_name}</h2><Badge tone={person.confidence >= 80 ? "lime" : person.confidence >= 65 ? "green" : "gray"}>{person.confidence}/100</Badge></div><div className="mt-1 text-sm font-bold text-[#66736d]">{person.title} | {person.company}</div><div className="mt-1 text-xs text-[#7a8781]">{person.location || "Location not verified"}</div></div><div className="flex gap-2">{person.profile_url && <a className="btn-secondary text-xs" href={person.profile_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Profile</a>}<button onClick={() => savePerson(person)} disabled={isSaved} className="btn-primary text-xs">{isSaved ? <Check size={14}/> : <Send size={14}/>} {isSaved ? "Saved" : "Save contact"}</button></div></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-[#f7f9f8] p-4"><div className="mb-2 text-xs font-extrabold text-[#164c3a]">Why reach out</div><p className="text-xs leading-5 text-[#60706a]">{person.why_reach_out}</p></div><div className="rounded-xl bg-[#f7f9f8] p-4"><div className="mb-2 text-xs font-extrabold text-[#164c3a]">Outreach angle</div><p className="text-xs leading-5 text-[#60706a]">{person.outreach_angle}</p></div></div>
              <div className="mt-4 rounded-xl border border-[#e4e9e6] bg-white p-4"><div className="mb-2 text-xs font-extrabold text-[#164c3a]">Message draft</div><p className="text-xs leading-5 text-[#60706a]">{person.message_draft}</p></div>
            </div>;
          })}</div>
          {result.searches_to_run_next?.length > 0 && <div className="card p-5"><div className="mb-3 text-sm font-extrabold">Searches to run next</div><div className="space-y-2">{result.searches_to_run_next.map((query) => <div key={query} className="rounded-xl bg-[#f7f9f8] px-3 py-2 text-xs font-bold text-[#60706a]">{query}</div>)}</div></div>}
        </div>}
      </div>
    </div>
  </>;
}
