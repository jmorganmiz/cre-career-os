"use client";

import { X } from "lucide-react";

export function RecordModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#0d241c]/45 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
      <div className="mb-5 flex items-center justify-between"><div><div className="eyebrow mb-1">Add to database</div><h2 className="text-xl font-extrabold">{title}</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[#f1f4f2]"><X size={17}/></button></div>
      {children}
    </div>
  </div>;
}

export function FormField({ label, name, required, type = "text", placeholder }: { label: string; name: string; required?: boolean; type?: string; placeholder?: string }) {
  return <label className="block text-xs font-extrabold">{label}<input className="input mt-2 text-sm" name={name} required={required} type={type} placeholder={placeholder}/></label>;
}
