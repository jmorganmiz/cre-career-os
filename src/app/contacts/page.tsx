"use client";

import { useRef, useState } from "react";
import { Check, Copy, Edit3, ExternalLink, LoaderCircle, Mail, MessageSquareText, Trash2, Upload } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { FormField, RecordModal } from "@/components/record-modal";
import { Badge, EmptyState, PageHeader, TableToolbar } from "@/components/ui";
import type { Contact } from "@/lib/types";
import { parseCsv } from "@/lib/csv";

const stages = ["All", "Target", "Drafted", "Sent", "Replied", "Follow-up due"];
const editableStages = stages.filter((stage) => stage !== "All" && stage !== "Follow-up due");

type MessageDraft = {
  message: string;
  subject?: string;
  follow_up: string;
  angle: string;
  demo?: boolean;
  agent_error?: string;
};

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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function stageFor(contact: Contact) {
  if (contact.status === "Sent" && contact.follow_up_at && contact.follow_up_at.slice(0, 10) <= todayKey()) return "Follow-up due";
  return contact.status || "Target";
}

function nextFollowUp() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export default function ContactsPage() {
  const { contacts, firms, add, update, remove, importMany, live } = useCareerData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [messageContact, setMessageContact] = useState<Contact | null>(null);
  const [draft, setDraft] = useState<MessageDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (form: FormData) => { await add("contacts", contactFromForm(form)); setOpen(false); };
  const submitEdit = async (form: FormData) => { if (!editing?.id) return; await update("contacts", editing.id, contactFromForm(form)); setEditing(null); };
  const upload = async (file?: File) => { if (file) await importMany("contacts", parseCsv<Contact>(await file.text()).filter((item) => item.first_name && item.last_name)); };
  const firmFor = (firmId?: string) => firms.find((firm) => firm.id === firmId);
  const firmName = (firmId?: string) => firmFor(firmId)?.name;

  const filteredContacts = contacts.filter((contact) => {
    const contactStatus = stageFor(contact);
    return (status === "All" || contactStatus === status) && includesQuery([
      contact.first_name, contact.last_name, `${contact.first_name} ${contact.last_name}`,
      contact.title, contact.email, contactStatus, firmName(contact.firm_id),
    ], query);
  });

  const setStage = async (contact: Contact, nextStage: string) => {
    if (!contact.id) return;
    const changes: Partial<Contact> = { status: nextStage };
    if (nextStage === "Sent" && !contact.follow_up_at) changes.follow_up_at = nextFollowUp();
    if (nextStage === "Replied") changes.follow_up_at = "";
    await update("contacts", contact.id, changes);
  };

  const generateMessage = async (contact: Contact) => {
    setMessageContact(contact);
    setDraft(null);
    setCopied(false);
    setDraftLoading(true);
    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, firm: firmFor(contact.firm_id) }),
      });
      setDraft(await response.json());
    } finally {
      setDraftLoading(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const saveDraft = async () => {
    if (!draft || !messageContact?.id) return;
    const entry = [`Outreach subject: ${draft.subject || "Informational conversation"}`, draft.message, `Angle: ${draft.angle}`].join("\n");
    await update("contacts", messageContact.id, {
      status: "Drafted",
      notes: [messageContact.notes, entry].filter(Boolean).join("\n\n"),
    });
    setMessageContact(null);
  };

  const formFields = (contact?: Contact) => <form action={contact ? submitEdit : submit} className="grid gap-4 sm:grid-cols-2">
    <FormField label="First name" name="first_name" required defaultValue={contact?.first_name}/>
    <FormField label="Last name" name="last_name" required defaultValue={contact?.last_name}/>
    <FormField label="Title" name="title" defaultValue={contact?.title}/>
    <label className="block text-xs font-extrabold">Firm<select name="firm_id" className="input mt-2 text-sm" defaultValue={contact?.firm_id || ""}><option value="">No firm</option>{firms.map((firm) => <option key={firm.id} value={firm.id}>{firm.name}</option>)}</select></label>
    <label className="block text-xs font-extrabold">Outreach stage<select name="status" className="input mt-2 text-sm" defaultValue={contact?.status || "Target"}>{editableStages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
    <FormField label="Relationship score" name="relationship_score" type="number" defaultValue={contact?.relationship_score ?? 0}/>
    <FormField label="Email" name="email" type="email" defaultValue={contact?.email}/>
    <FormField label="LinkedIn URL" name="linkedin_url" type="url" defaultValue={contact?.linkedin_url}/>
    <FormField label="Follow-up date" name="follow_up_at" type="date" defaultValue={contact?.follow_up_at?.slice(0, 10)}/>
    <label className="block text-xs font-extrabold sm:col-span-2">Notes<textarea name="notes" className="input mt-2 min-h-24 text-sm" defaultValue={contact?.notes}/></label>
    <button className="btn-primary sm:col-span-2">{contact ? "Save changes" : "Save contact"}</button>
  </form>;

  return <>
    <PageHeader eyebrow="Network" title="Contacts" description={`${live ? "Live Supabase data" : "Demo mode"} | Track every relationship from target to reply.`} action="Add contact" onAction={() => setOpen(true)} secondary={<><input ref={fileRef} className="hidden" type="file" accept=".csv" onChange={(event) => upload(event.target.files?.[0])}/><button className="btn-secondary text-sm" onClick={() => fileRef.current?.click()}><Upload size={15}/>Import CSV</button></>}/>
    {live && !contacts.length && !query && <div className="mb-5"><EmptyState title="No contacts yet" text="Add a recruiter, alumni contact, hiring manager, or referral target. Contacts can be linked to firms once you add them." action="Add first contact" onAction={() => setOpen(true)}/></div>}
    <div className="card overflow-hidden">
      <TableToolbar placeholder="Search names, firms, titles..." query={query} onQueryChange={setQuery} filters={stages.map((item) => ({ label: item, active: status === item, onClick: () => setStatus(item), count: item === "All" ? contacts.length : contacts.filter((contact) => stageFor(contact) === item).length }))}/>
      <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm">
        <thead className="bg-[#f8faf9] text-[10px] uppercase tracking-[.12em] text-[#7a8781]"><tr>{["Contact", "Firm", "Outreach stage", "Follow up", "Relationship", "Actions"].map((heading) => <th key={heading} className="px-5 py-3 font-extrabold">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#edf0ee]">{filteredContacts.map((contact) => {
          const currentStage = stageFor(contact);
          return <tr key={contact.id} className="hover:bg-[#fafbfa]">
            <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d9efe7] text-xs font-extrabold text-[#164c3a]">{contact.first_name[0]}{contact.last_name[0]}</div><div><div className="font-extrabold">{contact.first_name} {contact.last_name}</div><div className="mt-0.5 text-xs text-[#7a8781]">{contact.title || "Title TBD"}</div></div></div></td>
            <td className="px-5 py-4 font-bold">{firmName(contact.firm_id) || "No firm linked"}</td>
            <td className="px-5 py-4"><select aria-label={`Outreach stage for ${contact.first_name} ${contact.last_name}`} className="input min-w-[132px] !py-1.5 text-xs font-extrabold" value={currentStage === "Follow-up due" ? "Sent" : currentStage} onChange={(event) => setStage(contact, event.target.value)}>{editableStages.map((stage) => <option key={stage}>{stage}</option>)}</select>{currentStage === "Follow-up due" && <div className="mt-2"><Badge tone="amber">Follow-up due</Badge></div>}</td>
            <td className="px-5 py-4 text-[#68766f]">{contact.follow_up_at?.slice(0, 10) || "Not set"}</td>
            <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 rounded-full bg-[#edf1ef]"><div className="h-full rounded-full bg-[#4f806b]" style={{ width: `${contact.relationship_score || 0}%` }}/></div><span className="text-xs font-extrabold">{contact.relationship_score || 0}</span></div></td>
            <td className="px-5 py-4"><div className="flex items-center gap-3 text-[#718079]"><button onClick={() => generateMessage(contact)} title="Generate outreach message" aria-label="Generate outreach message"><MessageSquareText size={17}/></button>{contact.email && <a href={`mailto:${contact.email}`} title="Email contact" aria-label="Email contact"><Mail size={16}/></a>}{contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noreferrer" title="Open public profile" aria-label="Open public profile"><ExternalLink size={16}/></a>}<button onClick={() => setEditing(contact)} title="Edit contact" aria-label="Edit contact"><Edit3 size={16}/></button><button onClick={() => remove("contacts", contact.id)} title="Delete contact" aria-label="Delete contact"><Trash2 size={16}/></button></div></td>
          </tr>;
        })}</tbody>
      </table>{!filteredContacts.length && <div className="p-8 text-center text-sm font-bold text-[#7a8781]">No contacts match the current search.</div>}</div>
    </div>
    {open && <RecordModal title="New contact" onClose={() => setOpen(false)}>{formFields()}</RecordModal>}
    {editing && <RecordModal title="Edit contact" onClose={() => setEditing(null)}>{formFields(editing)}</RecordModal>}
    {messageContact && <RecordModal title={`Outreach to ${messageContact.first_name}`} onClose={() => setMessageContact(null)}>{draftLoading ? <div className="grid min-h-52 place-items-center text-center"><div><LoaderCircle className="mx-auto animate-spin text-[#164c3a]" size={26}/><div className="mt-3 text-sm font-extrabold">Writing a tailored message...</div></div></div> : draft ? <div className="space-y-4"><div className="rounded-xl bg-[#f7f9f8] p-4"><div className="text-xs font-extrabold text-[#164c3a]">Subject</div><div className="mt-2 text-sm font-bold">{draft.subject || "Informational conversation"}</div></div><div className="rounded-xl border border-[#e4e9e6] p-4"><div className="text-xs font-extrabold text-[#164c3a]">Message</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52645d]">{draft.message}</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7f9f8] p-4"><div className="text-xs font-extrabold">Angle</div><p className="mt-2 text-xs leading-5 text-[#60706a]">{draft.angle}</p></div><div className="rounded-xl bg-[#f7f9f8] p-4"><div className="text-xs font-extrabold">Follow-up</div><p className="mt-2 text-xs leading-5 text-[#60706a]">{draft.follow_up}</p></div></div>{draft.agent_error && <div className="rounded-xl border border-[#f1d4a8] bg-[#fff8ed] p-3 text-xs text-[#8a6120]">Fallback draft shown because live AI generation was unavailable.</div>}<div className="flex flex-wrap gap-3"><button onClick={copyDraft} className="btn-secondary flex-1 text-sm">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy message"}</button><button onClick={saveDraft} className="btn-primary flex-1 text-sm"><MessageSquareText size={15}/>Save as drafted</button></div></div> : <div className="text-sm text-[#7a8781]">No draft returned.</div>}</RecordModal>}
  </>;
}