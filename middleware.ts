import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function clean(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/auth/callback") || pathname.startsWith("/_next") || pathname === "/favicon.ico";
}

function isCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.nextUrl.pathname === "/api/automation/run" && request.headers.get("authorization") === `Bearer ${secret}`);
}

function isAllowedEmail(email?: string | null) {
  const allowed = process.env.CAREEROS_ALLOWED_EMAILS;
  if (!allowed) return false;
  const normalized = (email || "").trim().toLowerCase();
  return allowed.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).includes(normalized);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname) || isCronRequest(request)) return NextResponse.next();

  const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 503 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (!isAllowedEmail(data.user.email)) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"],
};
