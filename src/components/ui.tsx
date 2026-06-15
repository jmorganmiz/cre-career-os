import { ChevronRight, Filter, Plus, Search } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action, onAction, secondary }: { eyebrow: string; title: string; description: string; action?: string; onAction?: () => void; secondary?: React.ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div><div className="eyebrow mb-2">{eyebrow}</div><h1 className="text-3xl font-extrabold tracking-[-.035em]">{title}</h1><p className="mt-2 text-sm text-[#6f7c77]">{description}</p></div>
    <div className="flex gap-2">{secondary}{action && <button onClick={onAction} className="btn-primary text-sm"><Plus size={16} />{action}</button>}</div>
  </div>;
}

export function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "lime" | "gray" | "blue" | "amber" }) {
  const tones = { green: "bg-[#d9efe7] text-[#18513e]", lime: "bg-[#eff8cd] text-[#53651b]", gray: "bg-[#f0f2f1] text-[#60706a]", blue: "bg-[#e5eef7] text-[#365f85]", amber: "bg-[#fbefd7] text-[#8a6120]" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${tones[tone]}`}>{children}</span>;
}

export function TableToolbar({ placeholder }: { placeholder: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e9e6] p-4">
    <div className="relative min-w-[240px] flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 text-[#89948f]" size={16} /><input className="input !py-2 !pl-9 text-sm" placeholder={placeholder} /></div>
    <button className="btn-secondary text-sm"><Filter size={15} />Filters</button>
  </div>;
}

export function EmptyPrompt({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-dashed border-[#cdd8d3] bg-[#f9fbfa] p-4"><div className="text-sm font-extrabold">{title}</div><div className="mt-1 text-xs leading-5 text-[#718079]">{text}</div><button className="mt-3 flex items-center gap-1 text-xs font-extrabold text-[#164c3a]">Take action <ChevronRight size={13} /></button></div>;
}
