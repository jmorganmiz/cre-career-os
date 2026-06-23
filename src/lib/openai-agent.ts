type OpenAIContent = {
  text?: string;
  content?: OpenAIContent[];
};

type OpenAIResponseBody = {
  output_text?: string;
  output?: OpenAIContent[];
};

type AgentJsonResult<T> =
  | { ok: true; value: T; raw: string }
  | { ok: false; status: number; detail: string; raw?: string };

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function truncateDetail(detail: string) {
  return detail.length > 1200 ? `${detail.slice(0, 1200)}...` : detail;
}

function collectText(node: OpenAIContent): string[] {
  const ownText = typeof node.text === "string" ? [node.text] : [];
  const childText = Array.isArray(node.content) ? node.content.flatMap(collectText) : [];
  return [...ownText, ...childText];
}

function extractOutputText(data: OpenAIResponseBody) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
  if (!Array.isArray(data.output)) return "";
  return data.output.flatMap(collectText).join("");
}

function parseJsonFromText<T>(text: string): T {
  const withoutFence = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    return JSON.parse(withoutFence) as T;
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(withoutFence.slice(start, end + 1)) as T;
    throw new Error("OpenAI response did not contain a JSON object.");
  }
}

export async function runOpenAIJsonAgent<T>(prompt: string): Promise<AgentJsonResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, status: 0, detail: "OPENAI_API_KEY is not configured." };

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      tools: [{ type: "web_search", search_context_size: "low" }],
      input: prompt,
    }),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, detail: truncateDetail(await response.text()) };
  }

  const data = (await response.json()) as OpenAIResponseBody;
  const raw = extractOutputText(data);

  try {
    return { ok: true, value: parseJsonFromText<T>(raw), raw };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      detail: error instanceof Error ? error.message : "OpenAI response could not be parsed.",
      raw,
    };
  }
}
