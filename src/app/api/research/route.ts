import { NextResponse } from "next/server";
import { requirePrivateDeployment } from "@/lib/private-deployment";
import { careerProfilePrompt } from "@/lib/career-profile";
import { runOpenAIJsonAgent } from "@/lib/openai-agent";

type ResearchBrief = {
  firm_summary: string;
  fit: string;
  questions: string[];
  linkedin_message: string;
  talking_points: string[];
  red_flags: string[];
  sources: { title: string; url: string }[];
  demo?: boolean;
  agent_error?: string;
};

const fallback = (firm: string) => ({
  firm_summary: `${firm} is a target firm in your CRE career pipeline. Add an OpenAI API key to enable live web research and cited findings.`,
  fit: "Evaluate the firm's asset classes, growth priorities, technology strategy, and early-career development against your goals.",
  questions: ["What business priorities are most important this year?", "What differentiates high-performing early-career hires?", "How is the firm using data and AI in real workflows?"],
  linkedin_message: `Hi - I am exploring opportunities at the intersection of commercial real estate, technology, and analytics. ${firm} stood out to me, and I would value 15 minutes to learn about your experience and advice.`,
  talking_points: ["Commercial real estate fundamentals", "Comfort with data and cross-functional work", "Interest in practical technology adoption"],
  red_flags: ["Confirm role scope and team structure", "Research recent transactions and leadership changes", "Validate development and mentorship opportunities"],
  sources: [],
  demo: true,
});

function fallbackWithAgentError(firm: string, status: number, detail: string) {
  return {
    ...fallback(firm),
    firm_summary: `The research agent could not complete live OpenAI research, so this is a fallback brief for ${firm}. OpenAI returned status ${status}.`,
    agent_error: detail,
    demo: false,
  };
}

export async function POST(request: Request) {
  const privateDeployment = requirePrivateDeployment();
  if (privateDeployment) return privateDeployment;

  const input = await request.json();
  const firm = String(input.firm_name || "This firm");
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback(firm));

  const prompt = `Research ${firm} for Jack Morgan's post-grad commercial real estate job search.
${careerProfilePrompt()}

Website context: ${input.website_text || "none"}
Contact bio: ${input.contact_bio || "none"}
Job description: ${input.job_description || "none"}
Return only valid JSON with keys firm_summary, fit, questions (array), linkedin_message, talking_points (array), red_flags (array), sources (array of {title,url}). Be concise, specific, factual, and use current web research.`;

  const result = await runOpenAIJsonAgent<ResearchBrief>(prompt);
  if (result.ok) return NextResponse.json(result.value);
  if (result.raw) return NextResponse.json({ ...fallback(firm), firm_summary: result.raw || fallback(firm).firm_summary, agent_error: result.detail, demo: false });
  return NextResponse.json(fallbackWithAgentError(firm, result.status, result.detail));
}
