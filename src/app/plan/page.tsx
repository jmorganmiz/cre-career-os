"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Building2, CalendarCheck2, CheckCircle2, ContactRound, Search, UsersRound } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { useCareerData } from "@/components/data-provider";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function googleSearch(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export default function WeeklyPlanPage() {
  const { firms, contacts, applications } = useCareerData();
  const followUps = contacts.filter((contact) => (contact.follow_up_at && contact.follow_up_at.slice(0, 10) <= todayKey()) || contact.status === "Sent").slice(0, 6);
  const outreachTargets = contacts.filter((contact) => ["Target", "Drafted"].includes(contact.status || "Target")).slice(0, 6);
  const uncoveredFirms = firms.filter((firm) => (firm.priority || "Tier 3") === "Tier 1" && !contacts.some((contact) => contact.firm_id === firm.id)).slice(0, 6);
  const savedRoles = applications.filter((application) => ["Saved", "Networking"].includes(application.status || "Saved")).slice(0, 6);
  const searches = [
    '"2027 analyst" multifamily acquisitions Dallas careers',
    '"Summer 2027" commercial real estate internship capital markets',
    '"2027 new graduate" real estate analyst Charlotte OR Charleston',
    '"Summer 2027" PropTech strategy internship real estate',
    'site:linkedin.com/jobs "2027" real estate analyst lending',
  ];
  const firmName = (firmId?: string) => firms.find((firm) => firm.id === firmId)?.name || "No firm linked";

  return <>
    <PageHeader eyebrow="Execution system" title="Weekly plan" description="A focused Spring/Summer 2027 search cadence built from your live CRM."/>
    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Searches", value: searches.length, detail: "targeted queries", icon: Search, tone: "bg-[#d9efe7] text-[#164c3a]" },
        { label: "Outreach", value: outreachTargets.length, detail: "messages to send", icon: ContactRound, tone: "bg-[#e5eef7] text-[#365f85]" },
        { label: "Follow-ups", value: followUps.length, detail: "relationships due", icon: CalendarCheck2, tone: "bg-[#fbefd7] text-[#8a6120]" },
        { label: "Roles", value: savedRoles.length, detail: "saved or networking", icon: BriefcaseBusiness, tone: "bg-[#eff8cd] text-[#53651b]" },
      ].map(({ label, value, detail, icon: Icon, tone }) => <div key={label} className="card p-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={18}/></span><div className="mt-5 text-3xl font-extrabold">{value}</div><div className="mt-1 text-sm font-extrabold">{label}</div><div className="mt-1 text-xs text-[#738079]">{detail}</div></div>)}
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <div className="card overflow-hidden">
        <div className="border-b border-[#e4e9e6] p-5"><div className="flex items-center gap-2 text-sm font-extrabold"><Search size={16} className="text-[#164c3a]"/>Run five focused searches</div><p className="mt-1 text-xs text-[#7a8781]">Verify every role is for Spring or Summer 2027 before saving it.</p></div>
        <div className="divide-y divide-[#edf0ee]">{searches.map((query, index) => <a key={query} href={googleSearch(query)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafbfa]"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eef4f1] text-xs font-extrabold text-[#164c3a]">{index + 1}</span><span className="min-w-0 flex-1 text-xs font-bold leading-5 text-[#52645d]">{query}</span><ArrowUpRight size={14} className="text-[#89948f]"/></a>)}</div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e4e9e6] p-5"><div><div className="flex items-center gap-2 text-sm font-extrabold"><ContactRound size={16} className="text-[#164c3a]"/>Send targeted outreach</div><p className="mt-1 text-xs text-[#7a8781]">Drafted and target contacts ready for a first message.</p></div><Link href="/contacts" className="btn-secondary text-xs">Open contacts</Link></div>
        <div className="divide-y divide-[#edf0ee]">{outreachTargets.length ? outreachTargets.map((contact) => <Link key={contact.id} href="/contacts" className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafbfa]"><CheckCircle2 size={17} className="text-[#77a392]"/><div className="min-w-0 flex-1"><div className="text-sm font-extrabold">{contact.first_name} {contact.last_name}</div><div className="mt-1 text-xs text-[#7a8781]">{contact.title || "Title TBD"} | {firmName(contact.firm_id)}</div></div><Badge tone={contact.status === "Drafted" ? "blue" : "gray"}>{contact.status || "Target"}</Badge></Link>) : <div className="p-6 text-sm text-[#7a8781]">Add target contacts to build this queue.</div>}</div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e4e9e6] p-5"><div><div className="flex items-center gap-2 text-sm font-extrabold"><CalendarCheck2 size={16} className="text-[#164c3a]"/>Complete follow-ups</div><p className="mt-1 text-xs text-[#7a8781]">Sent messages and due dates that need attention.</p></div><Link href="/contacts" className="btn-secondary text-xs">Open queue</Link></div>
        <div className="divide-y divide-[#edf0ee]">{followUps.length ? followUps.map((contact) => <Link key={contact.id} href="/contacts" className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafbfa]"><CheckCircle2 size={17} className="text-[#d19a3f]"/><div className="min-w-0 flex-1"><div className="text-sm font-extrabold">{contact.first_name} {contact.last_name}</div><div className="mt-1 text-xs text-[#7a8781]">{firmName(contact.firm_id)} | due {contact.follow_up_at?.slice(0, 10) || "this week"}</div></div><Badge tone="amber">Due</Badge></Link>) : <div className="p-6 text-sm text-[#7a8781]">No follow-ups are due right now.</div>}</div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e4e9e6] p-5"><div><div className="flex items-center gap-2 text-sm font-extrabold"><Building2 size={16} className="text-[#164c3a]"/>Cover priority firms</div><p className="mt-1 text-xs text-[#7a8781]">Tier 1 firms where you still need a relationship.</p></div><Link href="/firms" className="btn-secondary text-xs">Open firms</Link></div>
        <div className="divide-y divide-[#edf0ee]">{uncoveredFirms.length ? uncoveredFirms.map((firm) => <Link key={firm.id} href={`/people?firm=${encodeURIComponent(firm.name)}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafbfa]"><UsersRound size={17} className="text-[#77a392]"/><div className="min-w-0 flex-1"><div className="text-sm font-extrabold">{firm.name}</div><div className="mt-1 text-xs text-[#7a8781]">{firm.category || "Target firm"} | {[firm.city, firm.state].filter(Boolean).join(", ") || "Location TBD"}</div></div><span className="text-xs font-extrabold text-[#164c3a]">Find people</span></Link>) : <div className="p-6 text-sm text-[#7a8781]">Every Tier 1 firm has at least one contact.</div>}</div>
      </div>
    </section>
  </>;
}