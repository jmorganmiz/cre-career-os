"use client";

import { useRef, useState } from "react";
import { Edit3, ExternalLink, Eye, Trash2, Upload } from "lucide-react";
import { useCareerData } from "@/components/data-provider";
import { FormField, RecordModal } from "@/components/record-modal";
import { Badge, EmptyState, PageHeader, TableToolbar } from "@/components/ui";
import type { Application } from "@/lib/types";
import { parseCsv } from "@/lib/csv";

const statuses = ["All", "Saved", "Networking", "Applied", "Interviewing", "Closed"];

function notePreview(notes?: string) {
  if (!notes) return "No saved context yet.";
  const nextStep = notes.split("\n").find((line) => line.startsWith("Next step:"));
  return (nextStep || notes.split("\n")[0]).replace(/^Next step:\s*/, "");
}

function includesQuery(values: (string | undefined)[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

export default function ApplicationsPage() {
  const { applications, firms, add, update, remove, importMany, live } = useCareerData();
  const [open,setOpen]=useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const fileRef=useRef<HTMLInputElement>(null);
  const submit=async(form:FormData)=>{await add("applications",Object.fromEntries(form) as Application);setOpen(false)};
  const submitEdit=async(form:FormData)=>{if(!editing?.id)return;await update("applications",editing.id,Object.fromEntries(form) as Partial<Application>);setEditing(null)};
  const upload=async(file?:File)=>{if(file)await importMany("applications",parseCsv<Application>(await file.text()).filter(x=>x.role_title))};
  const firmName = (firmId?: string) => firms.find((firm) => firm.id === firmId)?.name;
  const filteredApplications = applications.filter((application) => {
    const appStatus = application.status || "Saved";
    return (status === "All" || appStatus === status) && includesQuery([application.role_title, firmName(application.firm_id), application.city, appStatus, application.interview_stage, application.notes], query);
  });
  const formFields = (application?: Application) => <form action={application ? submitEdit : submit} className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><FormField label="Role title" name="role_title" required defaultValue={application?.role_title}/></div><label className="block text-xs font-extrabold">Firm<select name="firm_id" className="input mt-2 text-sm" defaultValue={application?.firm_id || ""}><option value="">No firm</option>{firms.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><FormField label="City" name="city" defaultValue={application?.city}/><label className="block text-xs font-extrabold">Status<select name="status" className="input mt-2 text-sm" defaultValue={application?.status || "Saved"}><option>Saved</option><option>Networking</option><option>Applied</option><option>Interviewing</option><option>Closed</option></select></label><FormField label="Interview stage" name="interview_stage" defaultValue={application?.interview_stage}/><FormField label="Date applied" name="date_applied" type="date" defaultValue={application?.date_applied}/><FormField label="Follow-up date" name="follow_up_at" type="date" defaultValue={application?.follow_up_at?.slice(0,10)}/><div className="sm:col-span-2"><FormField label="Job URL" name="job_url" type="url" defaultValue={application?.job_url}/></div><label className="block text-xs font-extrabold sm:col-span-2">Notes<textarea name="notes" className="input mt-2 min-h-28 text-sm" defaultValue={application?.notes}/></label><button className="btn-primary sm:col-span-2">{application ? "Save changes" : "Save application"}</button></form>;

  return <><PageHeader eyebrow="Opportunity pipeline" title="Applications" description={`${live ? "Live Supabase data" : "Demo mode"} | Track every role, referral, interview, and follow-up.`} action="Add application" onAction={()=>setOpen(true)} secondary={<><input ref={fileRef} className="hidden" type="file" accept=".csv" onChange={e=>upload(e.target.files?.[0])}/><button className="btn-secondary text-sm" onClick={()=>fileRef.current?.click()}><Upload size={15}/>Import CSV</button></>} />
  {live && !applications.length && !query && <div className="mb-5"><EmptyState title="No applications yet" text="Track saved roles, networking targets, applications, interviews, and follow-ups from one pipeline." action="Add first application" onAction={() => setOpen(true)} /></div>}
  <div className="card overflow-hidden"><TableToolbar placeholder="Search roles, firms, notes..." query={query} onQueryChange={setQuery} filters={statuses.map((item) => ({ label: item, active: status === item, onClick: () => setStatus(item), count: item === "All" ? applications.length : applications.filter((application) => (application.status || "Saved") === item).length }))} /><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-[#f8faf9] text-[10px] uppercase tracking-[.12em] text-[#7a8781]"><tr>{["Role","Status","Interview stage","Saved context","Next follow-up","Source",""].map(h=><th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#edf0ee]">{filteredApplications.map((a,i)=><tr key={a.id} className="hover:bg-[#fafbfa]"><td className="px-5 py-4"><div className="font-extrabold">{a.role_title}</div><div className="mt-1 text-xs text-[#7a8781]">{firmName(a.firm_id) || "No firm linked"} | {a.city || "Location TBD"}</div></td><td className="px-5 py-4"><Badge tone={i===0?"lime":i===1?"green":"blue"}>{a.status || "Saved"}</Badge></td><td className="px-5 py-4 text-[#5e6d66]">{a.interview_stage || "Not started"}</td><td className="max-w-[300px] px-5 py-4 text-xs leading-5 text-[#68766f]">{notePreview(a.notes)}</td><td className="px-5 py-4 font-bold text-[#164c3a]">{a.follow_up_at?.slice(0,10) || "Not set"}</td><td className="px-5 py-4">{a.job_url ? <a className="inline-flex items-center gap-1 text-xs font-extrabold text-[#164c3a]" href={a.job_url} target="_blank" rel="noreferrer"><ExternalLink size={13}/>Open</a> : <span className="text-xs text-[#8b9792]">None</span>}</td><td className="px-5 py-4"><div className="flex gap-3 text-[#718079]"><button onClick={()=>setSelected(a)} aria-label="View application details"><Eye size={16}/></button><button onClick={()=>setEditing(a)} aria-label="Edit application"><Edit3 size={16}/></button><button onClick={()=>remove("applications",a.id)} aria-label="Delete application"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!filteredApplications.length && <div className="p-8 text-center text-sm font-bold text-[#7a8781]">No applications match the current search.</div>}</div></div>
  {open&&<RecordModal title="New application" onClose={()=>setOpen(false)}>{formFields()}</RecordModal>}
  {editing&&<RecordModal title="Edit application" onClose={()=>setEditing(null)}>{formFields(editing)}</RecordModal>}
  {selected&&<RecordModal title="Application details" onClose={()=>setSelected(null)}><div className="space-y-4"><div className="rounded-xl bg-[#f7f9f8] p-4"><div className="text-xs font-bold text-[#718079]">Role</div><div className="mt-1 text-sm font-extrabold">{selected.role_title}</div><div className="mt-1 text-xs text-[#60706a]">{firmName(selected.firm_id) || "No firm linked"} | {selected.city || "Location TBD"}</div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f7f9f8] p-3"><div className="text-[11px] font-bold text-[#718079]">Status</div><div className="mt-1 text-xs font-extrabold">{selected.status || "Saved"}</div></div><div className="rounded-xl bg-[#f7f9f8] p-3"><div className="text-[11px] font-bold text-[#718079]">Follow-up</div><div className="mt-1 text-xs font-extrabold">{selected.follow_up_at?.slice(0,10) || "Not set"}</div></div><div className="rounded-xl bg-[#f7f9f8] p-3"><div className="text-[11px] font-bold text-[#718079]">Stage</div><div className="mt-1 text-xs font-extrabold">{selected.interview_stage || "Not started"}</div></div></div>{selected.job_url&&<a className="btn-secondary text-xs" href={selected.job_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Open source</a>}<div><div className="mb-2 text-xs font-extrabold text-[#164c3a]">Saved context</div><pre className="max-h-[320px] whitespace-pre-wrap rounded-xl border border-[#e4e9e6] bg-white p-4 text-xs leading-5 text-[#60706a]">{selected.notes || "No notes saved."}</pre></div><button className="btn-primary w-full text-sm" onClick={()=>{setEditing(selected);setSelected(null);}}>Edit application</button></div></RecordModal>}  </>;
}


