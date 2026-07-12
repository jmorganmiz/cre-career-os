import { createBrowserClient } from "@supabase/ssr";

function clean(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

export function createBrowserSupabase() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) throw new Error("Supabase browser auth is not configured.");
  return createBrowserClient(url, anonKey);
}
