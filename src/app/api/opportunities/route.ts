import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { runOpportunitySearch, type OpportunityInput } from "@/lib/opportunity-agent";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const input = await request.json() as OpportunityInput;
  const result = await runOpportunitySearch(input);
  return NextResponse.json(result.brief);
}
