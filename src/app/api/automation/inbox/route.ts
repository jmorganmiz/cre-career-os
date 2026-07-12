import { NextResponse } from "next/server";
import { handleAutomationInboxAction, type InboxAction } from "@/lib/automation-inbox";
import { PrivateDeploymentRequiredError, requirePrivateDeploymentAck } from "@/lib/private-deployment";
import { getServerSupabase, ownerId } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

function db() {
  requirePrivateDeploymentAck();
  const admin = getServerSupabase();
  if (!admin) throw new Error("Supabase server sync is not configured.");
  return admin;
}

export async function GET() {
  try {
    const admin = db();
    const { data, error } = await admin.from("automation_results").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ results: data || [] });
  } catch (error) {
    if (error instanceof PrivateDeploymentRequiredError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Inbox could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = db();
    const body = await request.json() as { id?: string; action?: InboxAction };
    if (!body.id || !body.action) return NextResponse.json({ error: "Missing inbox action." }, { status: 400 });
    if (body.action !== "dismiss" && body.action !== "save") return NextResponse.json({ error: "Unknown inbox action." }, { status: 400 });
    return NextResponse.json(await handleAutomationInboxAction(admin, ownerId, body.id, body.action));
  } catch (error) {
    if (error instanceof PrivateDeploymentRequiredError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Inbox action failed." }, { status: 500 });
  }
}
