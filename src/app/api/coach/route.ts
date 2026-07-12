import { NextResponse } from "next/server";
import { requirePrivateDeployment } from "@/lib/private-deployment";
import { careerProfilePrompt } from "@/lib/career-profile";
import { runOpenAIJsonAgent } from "@/lib/openai-agent";

type CoachInput = {
  question?: string;
  context?: {
    firms?: { name?: string; category?: string; priority?: string }[];
    applications?: { role_title?: string; status?: string; city?: string; notes?: string }[];
    contacts?: { first_name?: string; last_name?: string; status?: string; title?: string }[];
  };
};

type CoachResponse = {
  reply: string;
  next_actions: string[];
  searches_to_run: string[];
  timing_advice: string;
};

const fallback = (input: CoachInput): CoachResponse => ({
  reply: `Focus the search around Spring/Summer 2027 starts. For any role you find, first verify timing, new-grad eligibility, role quality, and whether the work builds toward multifamily investing, capital markets, development, PropTech, or AI-enabled real estate. Your question was: ${input.question || "What should I do next?"}`,
  next_actions: [
    "Run the Opportunity Finder with Spring/Summer 2027 timing left in the target timing field.",
    "Save only roles with a clear 2027 start path or a career page worth monitoring.",
    "For each saved role, find one analyst or associate to contact before applying.",
  ],
  searches_to_run: [
    "2027 commercial real estate analyst program multifamily",
    "summer 2027 real estate investment analyst internship",
    "2027 capital markets analyst real estate new graduate",
  ],
  timing_advice: "Search weekly now, but expect many Summer 2027 internships and 2027 analyst programs to appear in waves. Save target firms early and set follow-ups when applications are not open yet.",
});

export async function POST(request: Request) {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;

  const input = await request.json() as CoachInput;
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ...fallback(input), demo: true });

  const prompt = `You are Jack Morgan's CRE Career Coach inside his private career operating system.

Your job is to help him reason through jobs, timing, search strategy, outreach, and whether opportunities are worth pursuing. Be direct, practical, and specific. Optimize for Spring 2027 and Summer 2027 opportunities only.

${careerProfilePrompt()}

Current app context:
Firms: ${JSON.stringify(input.context?.firms?.slice(0, 12) || [])}
Applications: ${JSON.stringify(input.context?.applications?.slice(0, 12) || [])}
Contacts: ${JSON.stringify(input.context?.contacts?.slice(0, 12) || [])}

User question:
${input.question || "What should I do next in my 2027 job search?"}

Return only valid JSON with keys:
reply: string,
next_actions: string[] of 3-5 concrete next moves,
searches_to_run: string[] of 3-5 specific search queries,
timing_advice: string.

Rules:
- Keep advice focused on Spring/Summer 2027 roles, internships, analyst programs, and new-grad opportunities.
- If the user asks about a role, judge fit using timing, analytical responsibility, deal/capital allocation exposure, mentorship, location, and long-term path.
- If timing is unclear, tell him exactly what to verify before spending time applying.
- Do not recommend Summer 2026 roles unless they are only used as background context.
- Be concise but not generic.`;

  const result = await runOpenAIJsonAgent<CoachResponse>(prompt);
  if (result.ok) return NextResponse.json(result.value);
  if (result.raw) return NextResponse.json({ ...fallback(input), reply: result.raw, agent_error: result.detail, demo: false });
  return NextResponse.json({ ...fallback(input), agent_error: result.detail, demo: true });
}
