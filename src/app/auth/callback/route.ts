import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/auth";
import { safeInternalPath } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"), requestUrl.origin);
  const loginUrl = new URL("/login", requestUrl.origin);

  if (!code) {
    loginUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    loginUrl.searchParams.set("error", "auth_callback");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    loginUrl.searchParams.set("error", "auth_callback");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
