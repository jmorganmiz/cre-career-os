"use client";

import { useRef, useState } from "react";
import { Edit3, MoreHorizontal, Trash2, Upload } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { FormField, RecordModal } from "@/components/record-modal";
import { Badge, PageHeader, TableToolbar } from "@/components/ui";
import type { Firm } from "@/lib/types";
import { parseCsv } from "@/lib/csv";

const priorities = ["All", "Tier 1", "Tier 2", "Tier 3"];

function includesQuery(values: (string | undefined)[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

export default function FirmsPage() {
  const { firms, contacts, add, update, remove, importMany, live } = useCareerData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Firm | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = async (form: FormData) => { await add("firms", Object.fromEntries(form) as Firm); setOpen(false); };
  const submitEdit = async (form: FormData) => { if (!editing?.id) return; await update("firms", editing.id, Object.fromEntries(form) as Partial<Firm>); setEditing(null); };
  const upload = async (file?: File) => {
    if (!file) return;
    const items = parseCsv<Firm>(await file.text()).filter((item) => item.name);
    await importMany("firms", items);
    setMessage(`${items.length} firms imported`);
  };
  const filteredFirms = firms.filter((firm) => {
    const firmPriority = firm.priority || "Tier 3";
    return (priority === "All" || firmPriority === priority) && includesQuery([firm.name, firm.city, firm.state, firm.category, firmPriority, firm.why_interested, firm.notes], query);
  });
  const formFields = (firm?: Firm) => <form action={firm ? submitEdit : submit} className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><FormField label="Firm name" name="name" required defaultValue={firm?.name}/></div><FormField label="City" name="city" defaultValue={firm?.city}/><FormField label="State" name="state" defaultValue={firm?.state}/><FormField label="Category" name="category" placeholder="Multifamily, Lending, PropTech..." defaultValue={firm?.category}/><label className="block text-xs font-extrabold">Priority<select name="priority" className="input mt-2 text-sm" defaultValue={firm?.priority || "Tier 1"}><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option></select></label><FormField label="Website" name="website_url" type="url" defaultValue={firm?.website_url}/><FormField label="Careers page" name="careers_url" type="url" defaultValue={firm?.careers_url}/><label className="block text-xs font-extrabold sm:col-span-2">Why interested<textarea name="why_interested" className="input mt-2 min-h-24 text-sm" defaultValue={firm?.why_interested}/></label><label className="block text-xs font-extrabold sm:col-span-2">Notes<textarea name="notes" className="input mt-2 min-h-24 text-sm" defaultValue={firm?.notes}/></label><button className="btn-primary sm:col-span-2">{firm ? "Save changes" : "Save firm"}</button></form>;

  return <><PageHeader eyebrow="Relationship map" title="Firms" description={`${live ? "Live Supabase data" : "Demo mode"} | Build and prioritize your target firm universe.`} action="Add firm" onAction={() => setOpen(true)}
    secondary={<><input ref={fileRef} className="hidden" type="file" accept=".csv" onChange={(e) => upload(e.target.files?.[0])}/><button onClick={() => fileRef.current?.click()} className="btn-secondary text-sm"><Upload size={15}/>Import CSV</button></>} />
  {message && <div className="mb-4 rounded-xl bg-[#e7f4ee] px-4 py-3 text-xs font-bold text-[#164c3a]">{message}</div>}
  <div className="mb-5 grid gap-3 sm:grid-cols-3">{[["Tier 1 firms",firms.filter(f=>f.priority==="Tier 1").length,"Highest priority"],["Firms with contacts",new Set(contacts.map(c=>c.firm_id)).size,"Network coverage"],["Need research",firms.filter(f=>!f.ai_summary).length,"AI summaries missing"]].map(x=><div className="card p-4" key={x[0]}><div className="text-xs font-bold text-[#78857f]">{x[0]}</div><div className="mt-2 text-2xl font-extrabold">{x[1]}</div><div className="mt-1 text-xs text-[#8b9792]">{x[2]}</div></div>)}</div>
  <div className="card overflow-hidden"><TableToolbar placeholder="Search firms, markets, categories..." query={query} onQueryChange={setQuery} filters={priorities.map((item) => ({ label: item, active: priority === item, onClick: () => setPriority(item), count: item === "All" ? firms.length : firms.filter((firm) => (firm.priority || "Tier 3") === item).length }))} /><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-[#f8faf9] text-[10px] uppercase tracking-[.12em] text-[#7a8781]"><tr>{["Firm","Category","Priority","Contacts","Why it matters",""].map(h=><th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#edf0ee]">{filteredFirms.map((f,i)=><tr key={f.id ?? f.name} className="hover:bg-[#fafbfa]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8f1ed] text-xs font-extrabold text-[#164c3a]">{f.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div><div><div className="font-extrabold">{f.name}</div><div className="mt-0.5 text-xs text-[#7a8781]">{[f.city,f.state].filter(Boolean).join(", ") || "Location TBD"}</div></div></div></td><td className="px-5 py-4"><Badge tone="gray">{f.category || "Uncategorized"}</Badge></td><td className="px-5 py-4"><Badge tone={i<3?"lime":"green"}>{f.priority || "Tier 3"}</Badge></td><td className="px-5 py-4 font-bold">{contacts.filter(c=>c.firm_id===f.id).length}</td><td className="max-w-[260px] px-5 py-4 text-xs leading-5 text-[#68766f]">{f.why_interested || f.notes || "Add a reason this firm matters."}</td><td className="px-5 py-4"><div className="flex gap-3 text-[#718079]"><MoreHorizontal size={17}/><button onClick={()=>setEditing(f)} aria-label="Edit firm"><Edit3 size={16}/></button><button onClick={()=>remove("firms",f.id)} aria-label="Delete firm"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!filteredFirms.length && <div className="p-8 text-center text-sm font-bold text-[#7a8781]">No firms match the current search.</div>}</div></div>
  {open && <RecordModal title="New firm" onClose={()=>setOpen(false)}>{formFields()}</RecordModal>}
  {editing && <RecordModal title="Edit firm" onClose={()=>setEditing(null)}>{formFields(editing)}</RecordModal>}
  </>;
}
