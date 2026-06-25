"use client";

import { useState } from "react";
import { Bot, BriefcaseBusiness, LoaderCircle, MessageSquareText, Search, Send, Sparkles } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { Badge, PageHeader } from "@/components/ui";

type CoachResponse = {
  reply: string;
  next_actions: string[];
  searches_to_run: string[];
  timing_advice: string;
  demo?: boolean;
  agent_error?: string;
};

const starters = [
  "What should I search for this week for Summer 2027?",
  "Help me compare acquisitions, lending, and PropTech roles.",
  "What should I verify before saving a job?",
  "Which applications should I prioritize next?",
];

export default function CoachPage() {
  const { firms, contacts, applications } = useCareerData();
  const [question, setQuestion] = useState("What should I focus on this week for Spring or Summer 2027 roles?");
  const [answer, setAnswer] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async (prompt = question) => {
    setQuestion(prompt);
    setLoading(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          context: {
            firms: firms.map(({ name, category, priority }) => ({ name, category, priority })),
            contacts: contacts.map(({ first_name, last_name, status, title }) => ({ first_name, last_name, status, title })),
            applications: applications.map(({ role_title, status, city, notes }) => ({ role_title, status, city, notes })),
          },
        }),
      });
      setAnswer(await response.json());
    } finally {
      setLoading(false);
    }
  };

  return <>
    <PageHeader eyebrow="Career advisor" title="Coach" description="Talk through role fit, timing, search strategy, and next actions for Spring/Summer 2027." action="Ask coach" onAction={() => ask()} />
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <div className="card h-fit p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d9efe7] text-[#164c3a]"><Bot size={21}/></span>
          <div><div className="text-sm font-extrabold">Little career coach</div><div className="mt-1 text-xs text-[#718079]">2027 timing, role fit, and search advice</div></div>
        </div>
        <label className="block text-xs font-extrabold">What do you want help with?<textarea className="input mt-2 min-h-36 text-sm leading-6" value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
        <button onClick={() => ask()} disabled={loading || !question.trim()} className="btn-primary mt-4 w-full text-sm">{loading ? <LoaderCircle className="animate-spin" size={16}/> : <Send size={16}/>}Ask coach</button>
        <div className="mt-5 border-t border-[#e4e9e6] pt-5">
          <div className="mb-3 text-xs font-extrabold text-[#164c3a]">Fast prompts</div>
          <div className="space-y-2">{starters.map((starter) => <button key={starter} onClick={() => ask(starter)} className="w-full rounded-xl border border-[#e4e9e6] bg-white p-3 text-left text-xs font-bold text-[#60706a] hover:bg-[#f7f9f8]">{starter}</button>)}</div>
        </div>
      </div>

      <div>
        {loading ? <div className="card grid min-h-[460px] place-items-center p-8 text-center"><div><LoaderCircle className="mx-auto animate-spin text-[#164c3a]" size={30}/><div className="mt-4 text-sm font-extrabold">Thinking through the search...</div><div className="mt-1 text-xs text-[#7a8781]">Checking your CRM context and 2027 timing.</div></div></div> : !answer ? <div className="card grid min-h-[460px] place-items-center p-8 text-center"><div><MessageSquareText className="mx-auto text-[#77a392]" size={30}/><div className="mt-4 text-sm font-extrabold">Ask about any job or search decision</div><div className="mt-1 max-w-sm text-xs leading-5 text-[#7a8781]">Use this when you need to decide what to search, what to save, who to contact, or whether a role is worth pursuing.</div></div></div> : <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><Sparkles size={16} className="text-[#164c3a]"/>Coach answer</div><Badge tone={answer.demo ? "amber" : "green"}>{answer.demo ? "Fallback" : "Live"}</Badge></div>
            <p className="text-sm leading-6 text-[#5f6d67]">{answer.reply}</p>
            {answer.agent_error && <div className="mt-4 rounded-xl border border-[#f1d4a8] bg-[#fff8ed] p-3 text-xs leading-5 text-[#8a6120]">Live coach had an issue, so fallback advice is shown.</div>}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold"><BriefcaseBusiness size={16} className="text-[#164c3a]"/>Next actions</div><ul className="space-y-2">{answer.next_actions?.map((item) => <li key={item} className="text-sm leading-6 text-[#5f6d67]">- {item}</li>)}</ul></div>
            <div className="card p-5"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Search size={16} className="text-[#164c3a]"/>Searches to run</div><ul className="space-y-2">{answer.searches_to_run?.map((item) => <li key={item} className="text-sm leading-6 text-[#5f6d67]">- {item}</li>)}</ul></div>
          </div>
          <div className="card p-5"><div className="mb-2 text-sm font-extrabold">Timing advice</div><p className="text-sm leading-6 text-[#5f6d67]">{answer.timing_advice}</p></div>
        </div>}
      </div>
    </div>
  </>;
}
