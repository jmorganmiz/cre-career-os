import { NextResponse } from "next/server";
import { requirePrivateDeployment } from "@/lib/private-deployment";
import { careerProfilePrompt } from "@/lib/career-profile";
import { runOpenAIJsonAgent } from "@/lib/openai-agent";

type PeopleInput = {
  firm_name?: string;
  role_focus?: string;
  location?: string;
  seniority?: string;
};

type Person = {
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  company: string;
  location?: string;
  profile_url?: string;
  source_title?: string;
  why_reach_out: string;
  outreach_angle: string;
  message_draft: string;
  confidence: number;
};

type PeopleResponse = {
  search_summary: string;
  people: Person[];
  searches_to_run_next: string[];
  caveats: string[];
  demo?: boolean;
  agent_error?: string;
};

function fallback(input: PeopleInput): PeopleResponse {
  const firm = input.firm_name || "a target firm";
  return {
    search_summary: "Add or verify OPENAI_API_KEY on Vercel to enable public web people search. This fallback shows the format the finder will use.",
    people: [
      {
        full_name: "Target Analyst",
        first_name: "Target",
        last_name: "Analyst",
        title: "Analyst or Associate",
        company: firm,
        location: input.location || "Target market",
        profile_url: "",
        source_title: `${firm} LinkedIn search`,
        why_reach_out: "Good first outreach target because analysts and associates can explain role quality, timing, and hiring process.",
        outreach_angle: "Ask about Spring/Summer 2027 recruiting timing and what skills matter most for the analyst seat.",
        message_draft: `Hi - I am a Mizzou economics student graduating Spring 2027 and am researching ${firm}. I am interested in CRE analyst roles for Spring/Summer 2027 and would appreciate 10-15 minutes to hear about your path and what the team looks for.`,
        confidence: 45,
      },
    ],
    searches_to_run_next: [
      `site:linkedin.com/in ${firm} analyst real estate`,
      `site:linkedin.com/in ${firm} acquisitions associate`,
      `site:linkedin.com/in ${firm} capital markets analyst`,
    ],
    caveats: ["This tool uses public web search only. Verify profile details manually before outreach."],
    demo: true,
  };
}

export async function POST(request: Request) {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;

  const input = await request.json() as PeopleInput;
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback(input));

  const prompt = `You are a public-profile people finder for Jack Morgan's CRE Career OS.

Find likely people to reach out to using public web search results only. Do not imply private LinkedIn access, account login, scraping, or use of non-public data. It is okay to surface public LinkedIn profile URLs if web search provides them.

${careerProfilePrompt()}

Search target:
- Firm/company: ${input.firm_name || "target CRE firms"}
- Role focus: ${input.role_focus || "analysts, associates, acquisitions, asset management, capital markets, development, PropTech, recruiting"}
- Location: ${input.location || "Dallas, Charleston, Charlotte, San Diego, New York, or relevant office"}
- Preferred seniority: ${input.seniority || "analyst, associate, senior associate, recruiter, VP only if highly relevant"}

Return only valid JSON with keys:
search_summary: string,
people: array of 6-10 objects with keys full_name, first_name, last_name, title, company, location, profile_url, source_title, why_reach_out, outreach_angle, message_draft, confidence number 0-100,
searches_to_run_next: string[],
caveats: string[].

Rules:
- Prioritize people who are likely helpful for Spring/Summer 2027 recruiting: analysts, associates, alumni, recruiters, or team members near target roles.
- Prefer people at the specified firm. If not enough good matches exist, include adjacent firms and say why.
- Include a profile_url only if it appears to be a public source URL. Never fabricate a LinkedIn URL.
- If the exact first/last name is uncertain, exclude that person.
- Write message_draft as a short, respectful LinkedIn connection note or email-style note under 450 characters.
- Keep outreach angles specific: timing, role quality, team fit, skills, market, or referral path.
- Add caveats reminding the user to verify current title and company before reaching out.`;

  const result = await runOpenAIJsonAgent<PeopleResponse>(prompt);
  if (result.ok) return NextResponse.json(result.value);
  if (result.raw) return NextResponse.json({ ...fallback(input), search_summary: result.raw, agent_error: result.detail, demo: false });
  return NextResponse.json({ ...fallback(input), agent_error: result.detail, demo: true });
}
