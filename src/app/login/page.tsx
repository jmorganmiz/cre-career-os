"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LoaderCircle, LogIn, Mail } from "lucide-react";
import { createBrowserSupabase } from "@/lib/auth-client";
import { safeInternalPath } from "@/lib/safe-redirect";

function LoginContent() {
  const searchParams = useSearchParams();
  const next = safeInternalPath(searchParams.get("next"));
  const error = searchParams.get("error");
  const errorMessage = error === "unauthorized"
    ? "This account is not authorized for CareerOS."
    : error === "auth_callback"
      ? "Sign-in could not be completed. Try the magic link again."
      : "";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | "">("");

  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : undefined;

  const signInWithGoogle = async () => {
    setLoading("google");
    setMessage("");
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in could not start. Use email magic link instead.");
      setLoading("");
    }
  };

  const signInWithEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    setMessage("");
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMessage("Check your email for a magic sign-in link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Magic link could not be sent.");
    } finally {
      setLoading("");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f6] px-5 py-10">
      <section className="w-full max-w-md border border-[#dfe6e2] bg-white p-7 shadow-sm">
        <div className="mb-7">
          <div className="eyebrow mb-2">Private workspace</div>
          <h1 className="text-2xl font-extrabold tracking-[-.03em]">Sign in to CRE Career OS</h1>
          <p className="mt-2 text-sm leading-6 text-[#66736d]">Use your authorized Supabase account to access firms, applications, automation, and saved research.</p>
        </div>

        <button className="btn-primary w-full justify-center" disabled={Boolean(loading)} onClick={signInWithGoogle}>
          {loading === "google" ? <LoaderCircle className="animate-spin" size={16} /> : <LogIn size={16} />}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.14em] text-[#8a9691]">
          <span className="h-px flex-1 bg-[#e4e9e6]" />
          or magic link
          <span className="h-px flex-1 bg-[#e4e9e6]" />
        </div>

        <form onSubmit={signInWithEmail} className="space-y-3">
          <input className="input text-sm" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
          <button className="btn-secondary w-full justify-center" disabled={Boolean(loading) || !email.trim()} type="submit">
            {loading === "email" ? <LoaderCircle className="animate-spin" size={16} /> : <Mail size={16} />}
            Send magic link
          </button>
        </form>

        {(message || errorMessage) && <div className="mt-5 rounded-lg border border-[#dfe6e2] bg-[#f7f9f8] px-4 py-3 text-xs leading-5 text-[#52645d]">{message || errorMessage}</div>}
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f6f8f6] px-5 py-10" />}>
      <LoginContent />
    </Suspense>
  );
}
