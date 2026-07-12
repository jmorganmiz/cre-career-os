import { NextResponse } from "next/server";
import { executeWeeklyAutomation } from "@/lib/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const cronUserId = process.env.CRON_USER_ID;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (!cronUserId) return NextResponse.json({ error: "CRON_USER_ID is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    return NextResponse.json(await executeWeeklyAutomation(cronUserId, false));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduled automation failed." }, { status: 500 });
  }
}
