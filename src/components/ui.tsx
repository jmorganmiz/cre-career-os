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

type TableToolbarProps = {
  placeholder: string;
  query?: string;
  onQueryChange?: (value: string) => void;
  filters?: { label: string; active: boolean; onClick: () => void; count?: number }[];
};

export function TableToolbar({ placeholder, query = "", onQueryChange, filters = [] }: TableToolbarProps) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e9e6] p-4">
    <div className="relative min-w-[240px] max-w-sm flex-1"><Search className="absolute left-3 top-2.5 text-[#89948f]" size={16} /><input className="input !py-2 !pl-9 text-sm" placeholder={placeholder} value={query} onChange={(event) => onQueryChange?.(event.target.value)} /></div>
    {filters.length ? <div className="flex flex-wrap gap-2">
      {filters.map((filter) => <button key={filter.label} onClick={filter.onClick} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ${filter.active ? "bg-[#164c3a] text-white" : "border border-[#e1e7e4] bg-white text-[#66736d]"}`}>
        {filter.label}{typeof filter.count === "number" && <span className={filter.active ? "text-white/80" : "text-[#8b9792]"}>{filter.count}</span>}
      </button>)}
    </div> : <button className="btn-secondary text-sm"><Filter size={15} />Filters</button>}
  </div>;
}

export function EmptyState({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="rounded-xl border border-dashed border-[#cdd8d3] bg-[#f9fbfa] p-6 text-center">
    <div className="text-sm font-extrabold">{title}</div>
    <div className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#718079]">{text}</div>
    {action && <button onClick={onAction} className="btn-secondary mx-auto mt-4 text-xs">{action}<ChevronRight size={13} /></button>}
  </div>;
}

export function EmptyPrompt({ title, text }: { title: string; text: string }) {
  return <EmptyState title={title} text={text} action="Take action" />;
}
