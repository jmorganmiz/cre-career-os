"use client";

import { useRef, useState } from "react";
import { Edit3, Mail, Trash2, Upload } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { FormField, RecordModal } from "@/components/record-modal";
import { Badge, EmptyState, PageHeader, TableToolbar } from "@/components/ui";
import type { Contact } from "@/lib/types";
import { parseCsv } from "@/lib/csv";

const statuses = ["All", "Target", "Warm", "Connected", "Replied"];

function includesQuery(values: (string | undefined)[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function contactFromForm(form: FormData) {
  const value = Object.fromEntries(form) as unknown as Contact;
  value.relationship_score = Number(value.relationship_score || 0);
  return value;
}

export default function ContactsPage() {
  const { contacts, firms, add, update, remove, importMany, live } = useCareerData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = async (form: FormData) => { await add("contacts", contactFromForm(form)); setOpen(false); };
  const submitEdit = async (form: FormData) => { if (!editing?.id) return; await update("contacts", editing.id, contactFromForm(form)); setEditing(null); };
  const upload=async(file?:File)=>{if(file)await importMany("contacts",parseCsv<Contact>(await file.text()).filter(x=>x.first_name&&x.last_name))};
  const firmName = (firmId?: string) => firms.find((firm) => firm.id === firmId)?.name;
  const filteredContacts = contacts.filter((contact) => {
    const contactStatus = contact.status || "Target";
    return (status === "All" || contactStatus === status) && includesQuery([contact.first_name, contact.last_name, `${contact.first_name} ${contact.last_name}`, contact.title, contact.email, contactStatus, firmName(contact.firm_id)], query);
  });
  const formFields = (contact?: Contact) => <form action={contact ? submitEdit : submit} className="grid gap-4 sm:grid-cols-2"><FormField label="First name" name="first_name" required defaultValue={contact?.first_name}/><FormField label="Last name" name="last_name" required defaultValue={contact?.last_name}/><FormField label="Title" name="title" defaultValue={contact?.title}/><label className="block text-xs font-extrabold">Firm<select name="firm_id" className="input mt-2 text-sm" defaultValue={contact?.firm_id || ""}><option value="">No firm</option>{firms.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label className="block text-xs font-extrabold">Status<select name="status" className="input mt-2 text-sm" defaultValue={contact?.status || "Target"}><option>Target</option><option>Warm</option><option>Connected</option><option>Replied</option></select></label><FormField label="Relationship score" name="relationship_score" type="number" defaultValue={contact?.relationship_score ?? 0}/><FormField label="Email" name="email" type="email" defaultValue={contact?.email}/><FormField label="LinkedIn URL" name="linkedin_url" type="url" defaultValue={contact?.linkedin_url}/><FormField label="Follow-up date" name="follow_up_at" type="date" defaultValue={contact?.follow_up_at?.slice(0,10)}/><label className="block text-xs font-extrabold sm:col-span-2">Notes<textarea name="notes" className="input mt-2 min-h-24 text-sm" defaultValue={contact?.notes}/></label><button className="btn-primary sm:col-span-2">{contact ? "Save changes" : "Save contact"}</button></form>;

  return <><PageHeader eyebrow="Network" title="Contacts" description={`${live ? "Live Supabase data" : "Demo mode"} | Turn cold targets into real professional relationships.`} action="Add contact" onAction={()=>setOpen(true)} secondary={<><input ref={fileRef} className="hidden" type="file" accept=".csv" onChange={e=>upload(e.target.files?.[0])}/><button className="btn-secondary text-sm" onClick={()=>fileRef.current?.click()}><Upload size={15}/>Import CSV</button></>} />
  {live && !contacts.length && !query && <div className="mb-5"><EmptyState title="No contacts yet" text="Add a recruiter, alumni contact, hiring manager, or referral target. Contacts can be linked to firms once you add them." action="Add first contact" onAction={() => setOpen(true)} /></div>}
  <div className="card overflow-hidden"><TableToolbar placeholder="Search names, firms, titles..." query={query} onQueryChange={setQuery} filters={statuses.map((item) => ({ label: item, active: status === item, onClick: () => setStatus(item), count: item === "All" ? contacts.length : contacts.filter((contact) => (contact.status || "Target") === item).length }))} /><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f8faf9] text-[10px] uppercase tracking-[.12em] text-[#7a8781]"><tr>{["Contact","Firm","Status","Follow up","Relationship",""].map(h=><th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#edf0ee]">{filteredContacts.map((c,i)=><tr key={c.id} className="hover:bg-[#fafbfa]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d9efe7] text-xs font-extrabold text-[#164c3a]">{c.first_name[0]}{c.last_name[0]}</div><div><div className="font-extrabold">{c.first_name} {c.last_name}</div><div className="mt-0.5 text-xs text-[#7a8781]">{c.title || "Title TBD"}</div></div></div></td><td className="px-5 py-4 font-bold">{firmName(c.firm_id) || "No firm linked"}</td><td className="px-5 py-4"><Badge tone={i===0?"lime":"green"}>{c.status || "Target"}</Badge></td><td className="px-5 py-4 text-[#68766f]">{c.follow_up_at?.slice(0,10) || "Not set"}</td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 rounded-full bg-[#edf1ef]"><div className="h-full rounded-full bg-[#4f806b]" style={{width:`${c.relationship_score || 0}%`}} /></div><span className="text-xs font-extrabold">{c.relationship_score || 0}</span></div></td><td className="px-5 py-4"><div className="flex gap-3 text-[#718079]"><Mail size={16}/><button onClick={()=>setEditing(c)} aria-label="Edit contact"><Edit3 size={16}/></button><button onClick={()=>remove("contacts",c.id)} aria-label="Delete contact"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!filteredContacts.length && <div className="p-8 text-center text-sm font-bold text-[#7a8781]">No contacts match the current search.</div>}</div></div>
  {open&&<RecordModal title="New contact" onClose={()=>setOpen(false)}>{formFields()}</RecordModal>}
  {editing&&<RecordModal title="Edit contact" onClose={()=>setEditing(null)}>{formFields(editing)}</RecordModal>}
  </>;
}


