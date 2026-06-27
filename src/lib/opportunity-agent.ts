import { careerProfilePrompt } from "@/lib/career-profile";
import { runOpenAIJsonAgent } from "@/lib/openai-agent";

export type OpportunityInput = {
  opportunity_type?: string;
  career_path?: string;
  target_roles?: string;
  target_markets?: string;
  asset_classes?: string;
  company_types?: string;
  target_timing?: string;
  must_haves?: string;
  avoid?: string;
};

export type OpportunityBrief = ReturnType<typeof fallback>;

const fallback = (input: OpportunityInput) => ({
  search_summary: "Add OPENAI_API_KEY on Vercel to enable live opportunity discovery with web search. This demo output shows the format the agent will use.",
  strategy: [
    "Prioritize full-time roles starting in Spring 2027 or Summer 2027 only: new graduate programs, analyst roles, Forward Deployed roles, strategy roles, solutions roles, and permanent early-career positions.",
    "Prioritize roles that combine CRE fundamentals with capital markets, asset management, acquisitions, PropTech, or AI/data exposure.",
    "Use warm-network paths before applying cold, especially at firms already in your target list.",
    "Track promising roles as Saved first, then move to Networking once you find a contact.",
  ],
  opportunities: [
    {
      firm_name: "Walker & Dunlop",
      role_title: "2027 Capital Markets Analyst",
      city: "Bethesda, MD",
      category: "Lending",
      opportunity_type: "2027 new graduate analyst role",
      timing_score: 82,
      source_quality_score: 90,
      career_fit_score: 92,
      fit_score: 88,
      why_fit: "Strong match for lending, multifamily, capital markets, and early-career analytical exposure.",
      source_url: "https://www.walkerdunlop.com/careers/",
      source_title: "Walker & Dunlop Careers",
      next_step: "Verify Spring/Summer 2027 start eligibility, then contact a capital markets associate for role context.",
      talking_points: ["Multifamily lending interest", "Analytical underwriting foundation", "Desire to learn debt capital markets"],
      risks: ["Confirm exact office location", "Validate Spring/Summer 2027 start timing and new-grad eligibility"],
    },
    {
      firm_name: "VTS",
      role_title: "2027 Strategy & Operations Associate",
      city: "New York, NY",
      category: "PropTech",
      opportunity_type: "Full-time 2027 new graduate strategy role",
      timing_score: 78,
      source_quality_score: 88,
      career_fit_score: 85,
      fit_score: 82,
      why_fit: "Good bridge between CRE market knowledge, software workflows, data, and AI-related real estate strategy.",
      source_url: "https://www.vts.com/careers",
      source_title: "VTS Careers",
      next_step: "Research product strategy team members and tailor outreach around CRE workflow automation.",
      talking_points: ["CRE plus technology interest", "Comfort translating user problems into workflows", "AI/data curiosity"],
      risks: ["May require prior SaaS experience", "Verify the posting is for Summer 2027 or a 2027 graduate start"],
    },
  ],
  searches_to_run_next: [
    `${input.target_roles || "CRE analyst"} ${input.target_markets || "Dallas Atlanta Chicago"} Spring 2027 Summer 2027 careers`,
    `${input.company_types || "multifamily lending PropTech"} 2027 new graduate analyst roles summer 2027`,
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

function enforceFullTimeOnly(brief: OpportunityBrief): OpportunityBrief {
  const excludedPattern = /\b(intern|internship|summer analyst|co-?op|part[- ]time|temporary|student program)\b/i;
  const opportunities = brief.opportunities.filter((opportunity) => {
    const classification = `${opportunity.role_title} ${opportunity.opportunity_type}`;
    return !excludedPattern.test(classification);
  });
  const removed = brief.opportunities.length - opportunities.length;
  return {
    ...brief,
    opportunities,
    search_summary: removed > 0
      ? `${brief.search_summary} ${removed} non-full-time role(s) were removed.`
      : brief.search_summary,
  };
}

export async function runOpportunitySearch(input: OpportunityInput) {
  if (!process.env.OPENAI_API_KEY) return { brief: fallback(input) };

  const prompt = `You are an opportunity finder for Jack Morgan's post-grad commercial real estate job search.

Find current, relevant job opportunities using web search. Focus on commercial real estate, multifamily, lending, PropTech, applied AI, Forward Deployed Engineering, Forward Deployed Strategy, solutions engineering, and strategy/operations roles.

${careerProfilePrompt()}

User criteria:
- Opportunity type: ${input.opportunity_type || "full-time 2027 new graduate role, analyst or rotational program, Forward Deployed role, strategy role, or solutions role"}
- Career path: ${input.career_path || "Acquisitions / Investments, Lending / Capital Markets, Development, PropTech / AI real estate"}
- Target roles: ${input.target_roles || "CRE analyst, acquisitions analyst, asset management analyst, capital markets analyst, Forward Deployed Engineer, Forward Deployed Strategist, solutions engineer, strategy and operations, PropTech strategy, AI real estate"}
- Target markets: ${input.target_markets || "United States, with preference for major CRE markets"}
- Asset classes: ${input.asset_classes || "multifamily, commercial real estate"}
- Company types: ${input.company_types || "owners, operators, lenders, brokerages, PropTech, real estate AI companies, applied AI companies, enterprise software companies"}
- Target timing: ${input.target_timing || "Spring 2027 or Summer 2027 starts only; exclude Summer 2026 and immediate 2026 starts"}
- Must haves: ${input.must_haves || "early-career friendly, strong learning environment"}
- Avoid: ${input.avoid || "unclear fit or outdated postings"}

Return only valid JSON with keys:
search_summary: string,
strategy: string[],
opportunities: array of exactly 6 objects with keys firm_name, role_title, city, category, opportunity_type, fit_score number 0-100, timing_score number 0-100, source_quality_score number 0-100, career_fit_score number 0-100, why_fit, source_url, source_title, next_step, talking_points string[], risks string[],
searches_to_run_next: string[].

Rules:
- Prefer live career pages, reputable job pages, or company pages as sources.
- Only return full-time, permanent jobs or full-time new-graduate/rotational programs that are explicitly or plausibly for Spring 2027 or Summer 2027 starts.
- Exclude all internships, Summer Analyst internships, co-ops, temporary roles, part-time roles, student programs, immediate-start 2026 roles, experienced-only roles, and roles that clearly require graduation before 2027.
- In next_step or risks, state what to verify about Spring/Summer 2027 eligibility.
- Do not invent application URLs. If unsure, use the firm's careers page and say what to verify.
- Favor roles likely suitable for a recent graduate or early-career candidate.
- Quality gate: reject an opportunity unless it is full-time and permanent, Spring/Summer 2027 timing is explicit or plausible, it is early-career/new-grad eligible, the source is credible, the next action is clear, and the work offers either CRE/deal/capital allocation exposure or applied AI/customer deployment/technical strategy exposure.
- For Forward Deployed Engineer roles, distinguish software-engineering-heavy positions from Forward Deployed Strategist, solutions engineering, implementation, and technical strategy roles. Penalize or reject roles that clearly require a computer science/engineering degree or substantial production software engineering experience the candidate does not have.
- Reward roles that combine technical problem solving, customer discovery, implementation, analytics, strategy, communication, and ownership.
- Prefer direct company career pages over aggregator links when possible.
- If a source is only a general careers page, make the role_title honest, and put the exact verification step in next_step.
- Keep every opportunity specific and actionable.`;

  const result = await runOpenAIJsonAgent<OpportunityBrief>(prompt);
  if (result.ok) return { brief: enforceFullTimeOnly(result.value), usage: result.usage };
  if (result.raw) return {
    brief: { ...fallback(input), search_summary: result.raw || fallback(input).search_summary, agent_error: result.detail, demo: false },
    usage: result.usage,
  };
  return { brief: fallbackWithAgentError(input, result.status, result.detail), usage: result.usage };
}


