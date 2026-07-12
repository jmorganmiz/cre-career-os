import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, accessHash, getAccessKey, normalizeSecret, safeInternalPath } from "@/lib/private-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const accessKey = getAccessKey();
  if (!accessKey) return NextResponse.json({ error: "CareerOS private access is not configured." }, { status: 503 });

  const form = await request.formData();
  const next = safeInternalPath(form.get("next"));
  const submitted = normalizeSecret(String(form.get("key") || ""));

  if (!submitted || submitted !== accessKey) {
    const retryUrl = new URL("/access", request.url);
    retryUrl.searchParams.set("error", "invalid");
    retryUrl.searchParams.set("next", next);
    return NextResponse.redirect(retryUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.cookies.set(ACCESS_COOKIE_NAME, await accessHash(accessKey), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
