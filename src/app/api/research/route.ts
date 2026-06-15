import { NextResponse } from "next/server";
import { careerProfilePrompt } from "@/lib/career-profile";

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
  const input = await request.json();
  const firm = String(input.firm_name || "This firm");
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback(firm));

  const prompt = `Research ${firm} for Jack Morgan's post-grad commercial real estate job search.
${careerProfilePrompt()}

Website context: ${input.website_text || "none"}
Contact bio: ${input.contact_bio || "none"}
Job description: ${input.job_description || "none"}
Return only valid JSON with keys firm_summary, fit, questions (array), linkedin_message, talking_points (array), red_flags (array), sources (array of {title,url}). Be concise, specific, factual, and use current web research.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.4-mini", tools: [{ type: "web_search", search_context_size: "low" }], input: prompt }),
  });
  if (!response.ok) return NextResponse.json(fallbackWithAgentError(firm, response.status, await response.text()));
  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((x: { content?: { text?: string }[] }) => x.content || []).map((x: { text?: string }) => x.text || "").join("");
  try { return NextResponse.json(JSON.parse(text.replace(/^```json|```$/g, "").trim())); }
  catch { return NextResponse.json({ ...fallback(firm), firm_summary: text || fallback(firm).firm_summary, demo: false }); }
}
