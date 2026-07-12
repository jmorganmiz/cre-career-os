import { NextResponse } from "next/server";
import { requirePrivateDeployment } from "@/lib/private-deployment";
import { runOpportunitySearch, type OpportunityInput } from "@/lib/opportunity-agent";

export async function POST(request: Request) {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;

  const input = await request.json() as OpportunityInput;
  const result = await runOpportunitySearch(input);
  return NextResponse.json(result.brief);
}
