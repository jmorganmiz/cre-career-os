import { NextResponse } from "next/server";
import { accessConfigured } from "@/lib/private-access";

export function requirePrivateDeployment() {
  if (accessConfigured()) return null;
  return NextResponse.json(
    { error: "CareerOS private access is not configured. Set CAREEROS_ACCESS_KEY before deploying without Vercel SSO." },
    { status: 503 },
  );
}

export function ownerConfigError(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "CareerOS owner is not configured." }, { status: 503 });
}
