import { NextResponse } from "next/server";
import { privateDeploymentAcknowledged } from "@/lib/server-supabase";

export function requirePrivateDeployment() {
  if (privateDeploymentAcknowledged()) return null;
  return NextResponse.json(
    { error: "CareerOS private deployment is not enabled. Enable Vercel Deployment Protection and set CAREEROS_PRIVATE_DEPLOYMENT_ACK=true." },
    { status: 403 },
  );
}

export function ownerConfigError(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "CareerOS owner is not configured." }, { status: 503 });
}
