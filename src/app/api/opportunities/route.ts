import { NextResponse } from "next/server";
import { runOpportunitySearch, type OpportunityInput } from "@/lib/opportunity-agent";

export async function POST(request: Request) {
  const input = await request.json() as OpportunityInput;
  const result = await runOpportunitySearch(input);
  return NextResponse.json(result.brief);
}