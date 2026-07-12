import { KeyRound, LockKeyhole } from "lucide-react";
import { safeInternalPath } from "@/lib/private-access";

type AccessPageProps = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const params = await searchParams;
  const next = safeInternalPath(params?.next);
  const invalid = params?.error === "invalid";

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f6] px-5 py-10">
      <section className="w-full max-w-[420px] rounded-[18px] border border-[#e4e9e6] bg-white p-6 shadow-[0_18px_40px_rgba(20,42,34,.08)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d9efe7] text-[#164c3a]"><LockKeyhole size={20} /></span>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Private CareerOS</h1>
            <p className="mt-1 text-xs font-semibold text-[#718079]">Enter the private access key once on this browser.</p>
          </div>
        </div>

        <form action="/api/access" method="post" className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-[#33423c]">Access key</span>
            <input className="input" name="key" type="password" autoComplete="current-password" autoFocus required />
          </label>
          {invalid && <div className="rounded-lg border border-[#f1d4a8] bg-[#fff8ed] px-3 py-2 text-xs font-bold text-[#8a6120]">That key did not match. Try again.</div>}
          <button className="btn-primary w-full" type="submit"><KeyRound size={16} /> Open CareerOS</button>
        </form>
      </section>
    </main>
  );
}
