"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronRight, CircleCheck, Clock3, ContactRound, Flame,
  Lightbulb, Plus, Sparkles, Target, TrendingUp
} from "lucide-react";
import { Badge, EmptyPrompt } from "@/components/ui";
import { useCareerData } from "@/components/data-provider";
import { careerProfile } from "@/lib/career-profile";

const initialTasks = [
  { id: 1, title: "Follow up with Maya Reynolds", meta: "Greystar | due today", kind: "Follow-up", done: false },
  { id: 2, title: "Prepare for Greystar first round", meta: "Interview | tomorrow at 10:00 AM", kind: "Interview", done: false },
  { id: 3, title: "Send intro to Alex Morgan", meta: "VTS | no prior outreach", kind: "Outreach", done: false },
  { id: 4, title: "Apply to VTS Strategy & Ops role", meta: "Saved role | closes this week", kind: "Application", done: true },
  { id: 5, title: "Research Juniper Square team", meta: "Tier 2 firm | 0 contacts", kind: "Research", done: false },
];

const filters = ["All actions", "Today", "Outreach", "Applications"];

export default function Dashboard() {
  const { firms, contacts, applications, live } = useCareerData();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("All actions");
  const completed = tasks.filter((task) => task.done).length;
  const weeklyComplete = 16 + completed;
  const visibleTasks = useMemo(() => {
    if (filter === "Outreach") return tasks.filter((task) => ["Outreach", "Follow-up"].includes(task.kind));
    if (filter === "Applications") return tasks.filter((task) => task.kind === "Application");
    if (filter === "Today") return tasks.filter((task) => task.meta.includes("today"));
    return tasks;
  }, [filter, tasks]);

  const toggleTask = (id: number) => setTasks((current) =>
    current.map((task) => task.id === id ? { ...task, done: !task.done } : task)
  );

  return <>
    <section className="hero-panel mb-6 overflow-hidden rounded-[24px] p-6 text-white md:p-8">
      <div className="relative z-[1] flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#c9e7db]">
            <Flame size={14} className="text-[#d6f276]" /> Monday, June 15 | Week 4 | {live ? "Live data" : "Demo mode"}
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-.045em] md:text-[40px]">Build Jack&apos;s information advantage.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#c5d8d0]">{careerProfile.northStar}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#d6f276] px-4 py-2.5 text-sm font-extrabold text-[#173d30] hover:bg-white">
              <Target size={16} /> Start today&apos;s focus
            </button>
            <Link href="/research" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/15">
              <Sparkles size={16} /> Research a firm
            </Link>
          </div>
        </div>
        <div className="w-full max-w-[280px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center justify-between"><span className="text-xs font-bold text-[#c5d8d0]">Weekly goal</span><span className="text-xs font-extrabold">{weeklyComplete}/25</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d6f276] transition-all" style={{ width: `${weeklyComplete * 4}%` }} /></div>
          <div className="mt-4 flex items-end justify-between"><div><div className="text-3xl font-extrabold">{Math.round(weeklyComplete / 25 * 100)}%</div><div className="mt-1 text-[11px] text-[#b5ccc3]">You&apos;re ahead of last week</div></div><TrendingUp size={22} className="text-[#d6f276]" /></div>
        </div>
      </div>
    </section>

    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Priority firms", value: String(firms.filter(f=>f.priority==="Tier 1").length), delta: `${firms.length} total firms`, icon: Building2, tone: "bg-[#d9efe7] text-[#164c3a]", href: "/firms" },
        { label: "Active contacts", value: String(contacts.length), delta: `${contacts.filter(c=>c.follow_up_at).length} follow-ups set`, icon: ContactRound, tone: "bg-[#e5eef7] text-[#365f85]", href: "/contacts" },
        { label: "Applications", value: String(applications.length), delta: `${applications.filter(a=>a.status==="Interviewing").length} interviewing`, icon: BriefcaseBusiness, tone: "bg-[#fbefd7] text-[#8a6120]", href: "/applications" },
        { label: "Response rate", value: "42%", delta: "+8% vs. last month", icon: CircleCheck, tone: "bg-[#eff8cd] text-[#53651b]", href: "/contacts" },
      ].map(({ label, value, delta, icon: Icon, tone, href }) => <Link href={href} key={label} className="card metric-card group p-5">
        <div className="mb-5 flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span><ArrowUpRight size={16} className="text-[#a3ada9] group-hover:text-[#164c3a]" /></div>
        <div className="text-3xl font-extrabold tracking-tight">{value}</div><div className="mt-1 text-sm font-bold">{label}</div><div className="mt-2 text-xs font-semibold text-[#738079]">{delta}</div>
      </Link>)}
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <div className="card overflow-hidden">
        <div className="border-b border-[#e4e9e6] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-base font-extrabold">Action queue</div><div className="mt-1 text-xs text-[#78857f]">{tasks.filter(t => !t.done).length} moves left to complete this week</div></div><button className="btn-secondary !p-2"><Plus size={15} /></button></div>
          <div className="mt-4 flex gap-2 overflow-x-auto">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold ${filter === item ? "bg-[#164c3a] text-white" : "bg-[#f1f4f2] text-[#68766f] hover:bg-[#e7ece9]"}`}>{item}</button>)}</div>
        </div>
        <div className="divide-y divide-[#edf0ee]">
          {visibleTasks.map((task, i) => <div key={task.id} className={`group flex items-center gap-3 px-5 py-4 transition ${task.done ? "bg-[#f9fbfa] opacity-60" : "hover:bg-[#fafbfa]"}`}>
            <button onClick={() => toggleTask(task.id)} aria-label={`Mark ${task.title} complete`} className={`grid h-6 w-6 flex-none place-items-center rounded-full border transition ${task.done ? "border-[#164c3a] bg-[#164c3a] text-white" : "border-[#c4d0cb] text-transparent hover:border-[#164c3a]"}`}><Check size={13} strokeWidth={3} /></button>
            <div className="min-w-0 flex-1"><div className={`truncate text-sm font-bold ${task.done ? "line-through" : ""}`}>{task.title}</div><div className="mt-1 flex items-center gap-1.5 text-xs text-[#7b8882]"><Clock3 size={12} />{task.meta}</div></div>
            <Badge tone={i === 0 ? "amber" : i === 1 ? "blue" : "gray"}>{task.kind}</Badge><ChevronRight size={15} className="text-[#abb4b0]" />
          </div>)}
          {visibleTasks.length === 0 && <div className="p-8 text-center"><CircleCheck className="mx-auto text-[#77a392]" size={26}/><div className="mt-3 text-sm font-extrabold">Nothing due in this view</div><div className="mt-1 text-xs text-[#7b8882]">Nice. Pick another focus area.</div></div>}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between"><div><div className="text-sm font-extrabold">Pipeline health</div><div className="mt-1 text-xs text-[#78857f]">{applications.length} active opportunities</div></div><CalendarDays size={17} className="text-[#819088]" /></div>
          <div className="flex h-32 items-end gap-2 rounded-xl bg-[#f7f9f8] px-4 pt-5">
            {[28,42,35,58,52,76,68,88].map((height, i)=><div key={i} className="group relative flex-1"><div className="pipeline-bar w-full rounded-t-md bg-[#80a593] transition-all group-hover:bg-[#164c3a]" style={{height}} /></div>)}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">{["Networking","Applied","Interviewing"].map(label=><div key={label} className="rounded-xl bg-[#f7f9f8] p-2"><div className="text-lg font-extrabold">{applications.filter(a=>a.status===label).length}</div><div className="text-[10px] font-bold text-[#78857f]">{label}</div></div>)}</div>
          <Link href="/applications" className="mt-5 flex items-center justify-between border-t border-[#edf0ee] pt-4 text-xs font-extrabold text-[#164c3a]">View pipeline <ChevronRight size={14} /></Link>
        </div>
        <div className="insight-card rounded-[18px] p-5">
          <div className="flex items-center gap-2 text-sm font-extrabold"><Lightbulb size={16} /> This week&apos;s insight</div>
          <p className="mt-3 text-sm leading-6 text-[#52645d]">Prioritize roles with analytical responsibility, deal exposure, mentorship, and a clear path toward multifamily investing or capital allocation.</p>
          <Link href="/contacts" className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#164c3a]">Find referral paths <ArrowRight size={13}/></Link>
        </div>
        <div className="card p-5"><div className="mb-4 text-sm font-extrabold">Priority firms with no contacts</div><div className="space-y-3">{firms.filter(f => !contacts.some(c=>c.firm_id===f.id)).slice(0,3).map(f => <EmptyPrompt key={f.id ?? f.name} title={f.name} text={`${f.category || "Uncategorized"} | ${[f.city,f.state].filter(Boolean).join(", ") || "Location TBD"}`} />)}</div></div>
      </div>
    </section>
  </>;
}
