"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, ContactRound, LayoutDashboard, BriefcaseBusiness, Sparkles,
  Search, Bell, Plus, Settings, ChevronDown, Radar
} from "lucide-react";
import { useState } from "react";
import { useCareerData } from "@/components/data-provider";
import { RecordModal } from "@/components/record-modal";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/firms", label: "Firms", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/opportunities", label: "Opportunities", icon: Radar },
  { href: "/research", label: "AI Research", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, live, notice, clearNotice, signIn, signOut } = useCareerData();
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  return (
    <div className="min-h-screen">
      <aside className="desktop-sidebar fixed inset-y-0 left-0 z-20 flex w-[232px] flex-col bg-[#123d30] px-3 py-4 text-white">
        <div className="mb-7 flex items-center gap-3 px-3 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d6f276] text-[#123d30]">
            <Building2 size={19} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight">CRE Career OS</div>
            <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9eb9af]">Command center</div>
          </div>
        </div>
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#83a398]">Workspace</div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-white text-[#123d30]" : "text-[#c2d4cd] hover:bg-white/8 hover:text-white"}`}>
                <Icon size={17} />{label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/6 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-[#d6f276]" /> Weekly momentum</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] rounded-full bg-[#d6f276]" /></div>
            <div className="mt-2 text-[11px] text-[#a8c0b7]">17 of 25 actions complete</div>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#c2d4cd] hover:bg-white/8 hover:text-white"><Settings size={17} />Settings</button>
        </div>
      </aside>
      <main className="app-main ml-[232px] min-h-screen">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[#e4e9e6] bg-[#f6f8f6]/95 px-5 backdrop-blur md:px-8">
          <div className="relative hidden w-full max-w-[360px] md:block">
            <Search className="absolute left-3 top-2.5 text-[#89948f]" size={16} />
            <input className="input !bg-white !py-2 !pl-9 text-sm" placeholder="Search firms, contacts, roles..." />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/firms" className="btn-primary text-sm"><Plus size={16} /> Add firm</Link>
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e9e6] bg-white text-[#66736e]"><Bell size={16} /></button>
            <button onClick={()=>setAccountOpen(true)} className="ml-1 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-white">
              <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-[#d9efe7] text-xs font-extrabold text-[#164c3a]">JM<span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${live?"bg-[#54a57f]":"bg-[#d6a54c]"}`}/></span>
              <ChevronDown className="desktop-only text-[#7c8984]" size={14} />
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-[1480px] p-5 md:p-8">{notice&&<button onClick={clearNotice} className={`mb-5 w-full rounded-xl border px-4 py-3 text-left text-xs font-bold ${notice.tone==="error"?"border-[#f1d4a8] bg-[#fff8ed] text-[#8a6120]":"border-[#cfe6db] bg-[#eef8f3] text-[#164c3a]"}`}>{notice.message}</button>}{children}</div>
      </main>
      {accountOpen&&<RecordModal title="Account & data sync" onClose={()=>setAccountOpen(false)}>{user?<div><div className="rounded-xl bg-[#eef5f2] p-4"><div className="text-xs font-bold text-[#718079]">Signed in as</div><div className="mt-1 text-sm font-extrabold">{user.email}</div><div className="mt-2 text-xs text-[#557166]">Your records are syncing with Supabase.</div></div><button onClick={signOut} className="btn-secondary mt-4 w-full">Sign out</button></div>:<form action={async(form)=>setAuthMessage(await signIn(String(form.get("email"))))}><p className="mb-4 text-sm leading-6 text-[#65736d]">Sign in with a secure email link to save and sync your career data. Without Supabase credentials, the app stays in demo mode.</p><label className="block text-xs font-extrabold">Email<input name="email" type="email" required className="input mt-2 text-sm" placeholder="you@email.com"/></label><button className="btn-primary mt-4 w-full">Send magic link</button>{authMessage&&<div className="mt-3 rounded-lg bg-[#f2f5f3] p-3 text-xs font-bold text-[#557166]">{authMessage}</div>}</form>}</RecordModal>}
    </div>
  );
}
