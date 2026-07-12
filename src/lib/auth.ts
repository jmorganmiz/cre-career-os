import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function clean(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function supabaseUrl() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
}

function supabaseAnonKey() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function createServerSupabase() {
  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; route handlers and middleware can.
        }
      },
    },
  });
}

export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return { response: NextResponse.json({ error: "Supabase auth is not configured." }, { status: 503 }) };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  if (!isAllowedEmail(data.user.email)) return { response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  return { user: data.user };
}

export function isAllowedEmail(email?: string | null) {
  const allowed = process.env.CAREEROS_ALLOWED_EMAILS;
  if (!allowed) return false;
  const normalized = (email || "").trim().toLowerCase();
  return allowed.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).includes(normalized);
}
