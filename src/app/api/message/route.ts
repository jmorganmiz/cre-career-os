import { NextResponse } from "next/server";
import { careerProfilePrompt } from "@/lib/career-profile";
import { runOpenAIJsonAgent } from "@/lib/openai-agent";

type MessageInput = {
  contact: { first_name?: string; last_name?: string; title?: string; notes?: string; linkedin_url?: string };
  firm?: { name?: string; category?: string; city?: string; state?: string; why_interested?: string };
  purpose?: string;
};

type MessageResponse = {
  message: string;
  subject?: string;
  follow_up: string;
  angle: string;
};

function fallback(input: MessageInput): MessageResponse {
  const name = input.contact.first_name || "there";
  const firm = input.firm?.name || "your team";
  return {
    subject: `Quick question about ${firm}`,
    message: `Hi ${name} - I am a Mizzou economics student graduating Spring 2027 and am researching ${firm}. I am interested in Spring/Summer 2027 CRE analyst opportunities and would appreciate 10-15 minutes to hear about your path and what the team looks for.`,
    follow_up: "Follow up in 5-7 days if there is no response.",
    angle: "Spring/Summer 2027 recruiting timing, role quality, and skills to build before applying.",
  };
}

export async function POST(request: Request) {
  const input = await request.json() as MessageInput;
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ...fallback(input), demo: true });

  const prompt = `Write a concise outreach message for Jack Morgan.

${careerProfilePrompt()}

Contact:
${JSON.stringify(input.contact)}

Firm:
${JSON.stringify(input.firm || {})}

Purpose: ${input.purpose || "Ask for a short informational conversation about Spring/Summer 2027 CRE opportunities."}

Return only valid JSON with keys:
message: string under 450 characters,
subject: string,
follow_up: string,
angle: string.

Rules:
- Keep it natural, respectful, and specific.
- Mention Spring 2027 graduation or Spring/Summer 2027 timing.
- Do not ask directly for a job or referral in the first message.
- Make the angle relevant to their title, firm, and Jack's CRE goals.`;

  const result = await runOpenAIJsonAgent<MessageResponse>(prompt);
  if (result.ok) return NextResponse.json(result.value);
  return NextResponse.json({ ...fallback(input), agent_error: result.detail, demo: true });
}
