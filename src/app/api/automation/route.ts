import { NextResponse } from "next/server";
import { executeWeeklyAutomation, getAutomationSnapshot, setAutomationEnabled } from "@/lib/automation";
import { requirePrivateDeployment, ownerConfigError } from "@/lib/private-deployment";
import { getOwnerId } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

function message(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Automation request failed.";
}

export async function GET() {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;

  let userId: string;
  try {
    userId = getOwnerId();
  } catch (error) {
    return ownerConfigError(error);
  }

  try {
    return NextResponse.json(await getAutomationSnapshot(userId));
  } catch (error) {
    const detail = message(error);
    return NextResponse.json({ error: detail, setupRequired: detail.toLowerCase().includes("automation_") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;

  let userId: string;
  try {
    userId = getOwnerId();
  } catch (error) {
    return ownerConfigError(error);
  }

  try {
    const body = await request.json() as { action?: string; enabled?: boolean };
    if (body.action === "setEnabled") return NextResponse.json(await setAutomationEnabled(userId, Boolean(body.enabled)));
    if (body.action === "runNow") {
      const result = await executeWeeklyAutomation(userId, true);
      return NextResponse.json({ result, snapshot: await getAutomationSnapshot(userId) });
    }
    return NextResponse.json({ error: "Unknown automation action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}
