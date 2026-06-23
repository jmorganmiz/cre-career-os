import { NextResponse } from "next/server";
import { careerProfilePrompt } from "@/lib/career-profile";
import { runOpenAIJsonAgent } from "@/lib/openai-agent";

type OpportunityInput = {
  target_roles?: string;
  target_markets?: string;
  asset_classes?: string;
  company_types?: string;
  must_haves?: string;
  avoid?: string;
};

type OpportunityBrief = ReturnType<typeof fallback>;

const fallback = (input: OpportunityInput) => ({
  search_summary: "Add OPENAI_API_KEY on Vercel to enable live opportunity discovery with web search. This demo output shows the format the agent will use.",
  strategy: [
    "Prioritize roles that combine CRE fundamentals with capital markets, asset management, acquisitions, PropTech, or AI/data exposure.",
    "Use warm-network paths before applying cold, especially at firms already in your target list.",
    "Track promising roles as Saved first, then move to Networking once you find a contact.",
  ],
  opportunities: [
    {
      firm_name: "Walker & Dunlop",
      role_title: "Capital Markets Analyst",
      city: "Bethesda, MD",
      category: "Lending",
      fit_score: 88,
      why_fit: "Strong match for lending, multifamily, capital markets, and early-career analytical exposure.",
      source_url: "https://www.walkerdunlop.com/careers/",
      source_title: "Walker & Dunlop Careers",
      next_step: "Look for an analyst role and contact a capital markets associate for role context.",
      talking_points: ["Multifamily lending interest", "Analytical underwriting foundation", "Desire to learn debt capital markets"],
      risks: ["Confirm exact office location", "Validate new-grad eligibility"],
    },
    {
      firm_name: "VTS",
      role_title: "Strategy & Operations Associate",
      city: "New York, NY",
      category: "PropTech",
      fit_score: 82,
      why_fit: "Good bridge between CRE market knowledge, software workflows, data, and AI-related real estate strategy.",
      source_url: "https://www.vts.com/careers",
      source_title: "VTS Careers",
      next_step: "Research product strategy team members and tailor outreach around CRE workflow automation.",
      talking_points: ["CRE plus technology interest", "Comfort translating user problems into workflows", "AI/data curiosity"],
      risks: ["May require prior SaaS experience", "Role availability changes quickly"],
    },
  ],
  searches_to_run_next: [
    `${input.target_roles || "CRE analyst"} ${input.target_markets || "Dallas Atlanta Chicago"} careers`,
    `${input.company_types || "multifamily lending PropTech"} new graduate analyst roles`,
  ],
  demo: true,
});

function fallbackWithAgentError(input: OpportunityInput, status: number, detail: string) {
  return {
    ...fallback(input),
    search_summary: `The opportunity agent could not complete live OpenAI research, so these are fallback opportunities. OpenAI returned status ${status}.`,
    agent_error: detail,
    demo: false,
  };
}

export async function POST(request: Request) {
  const input = await request.json() as OpportunityInput;
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback(input));

  const prompt = `You are an opportunity finder for Jack Morgan's post-grad commercial real estate job search.

Find current, relevant job opportunities using web search. Focus on commercial real estate, multifamily, lending, PropTech, and AI/data-related real estate roles.

${careerProfilePrompt()}

User criteria:
- Target roles: ${input.target_roles || "CRE analyst, acquisitions analyst, asset management analyst, capital markets analyst, PropTech strategy, AI real estate"}
- Target markets: ${input.target_markets || "United States, with preference for major CRE markets"}
- Asset classes: ${input.asset_classes || "multifamily, commercial real estate"}
- Company types: ${input.company_types || "owners, operators, lenders, brokerages, PropTech, real estate AI companies"}
- Must haves: ${input.must_haves || "early-career friendly, strong learning environment"}
- Avoid: ${input.avoid || "unclear fit or outdated postings"}

Return only valid JSON with keys:
search_summary: string,
strategy: string[],
opportunities: array of exactly 6 objects with keys firm_name, role_title, city, category, fit_score number 0-100, why_fit, source_url, source_title, next_step, talking_points string[], risks string[],
searches_to_run_next: string[].

Rules:
- Prefer live career pages, reputable job pages, or company pages as sources.
- Do not invent application URLs. If unsure, use the firm's careers page and say what to verify.
- Favor roles likely suitable for a recent graduate or early-career candidate.
- Keep every opportunity specific and actionable.`;

  const result = await runOpenAIJsonAgent<OpportunityBrief>(prompt);
  if (result.ok) return NextResponse.json(result.value);
  if (result.raw) return NextResponse.json({ ...fallback(input), search_summary: result.raw || fallback(input).search_summary, agent_error: result.detail, demo: false });
  return NextResponse.json(fallbackWithAgentError(input, result.status, result.detail));
}
