import { NextResponse } from "next/server";
import { executeWeeklyAutomation } from "@/lib/automation";
import { requirePrivateDeployment, ownerConfigError } from "@/lib/private-deployment";
import { getOwnerId } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;

  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });

  let ownerId: string;
  try {
    ownerId = getOwnerId();
  } catch (error) {
    return ownerConfigError(error);
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    return NextResponse.json(await executeWeeklyAutomation(ownerId, false));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduled automation failed." }, { status: 500 });
  }
}
