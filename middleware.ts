import { NextResponse, type NextRequest } from "next/server";

function clean(value?: string) {
  return value?.trim().replace(/^[']|[']$/g, "").replace(/^[\"]|[\"]$/g, "");
}

function privateDeploymentAcknowledged() {
  return clean(process.env.CAREEROS_PRIVATE_DEPLOYMENT_ACK)?.toLowerCase() === "true";
}
function isAssetPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname === "/favicon.ico";
}

function isCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.nextUrl.pathname === "/api/automation/run" && request.headers.get("authorization") === `Bearer ${secret}`);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isAssetPath(pathname)) return NextResponse.next();

  if (!privateDeploymentAcknowledged()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "CareerOS private deployment is not enabled. Enable Vercel Deployment Protection and set CAREEROS_PRIVATE_DEPLOYMENT_ACK=true." },
        { status: 403 },
      );
    }
    return new NextResponse("CareerOS private deployment is not enabled.", { status: 403 });
  }

  if (isCronRequest(request)) return NextResponse.next();
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"],
};
