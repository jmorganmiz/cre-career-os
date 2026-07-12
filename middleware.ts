import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE_NAME, accessHash, getAccessKey, safeInternalPath } from "@/lib/private-access";

function isPublicPath(pathname: string) {
  return pathname.startsWith("/_next")
    || pathname === "/favicon.ico"
    || pathname === "/access"
    || pathname === "/api/access";
}

function isCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.nextUrl.pathname === "/api/automation/run" && request.headers.get("authorization") === `Bearer ${secret}`);
}

function privateAccessUnavailable(pathname: string) {
  const message = "CareerOS private access is not configured. Set CAREEROS_ACCESS_KEY before deploying without Vercel SSO.";
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: message }, { status: 503 });
  return new NextResponse(message, { status: 503 });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname)) return NextResponse.next();
  if (isCronRequest(request)) return NextResponse.next();

  const accessKey = getAccessKey();
  if (!accessKey) return privateAccessUnavailable(pathname);

  const expected = await accessHash(accessKey);
  const actual = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (actual === expected) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Private access required." }, { status: 401 });

  const accessUrl = new URL("/access", request.url);
  accessUrl.searchParams.set("next", safeInternalPath(`${pathname}${request.nextUrl.search}`));
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"],
};
