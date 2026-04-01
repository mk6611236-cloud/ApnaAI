import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role?: string;
  content?: string;
};

// --- यहाँ बदलाव किया गया है: आपके सफल ऐप वाला स्टेबल मॉडल ---
const GEMINI_MODEL = "gemini-1.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

// --- सिस्टम इंस्ट्रक्शन (वही जो आपके app.py में काम कर रहा था) ---
const SYSTEM_INSTRUCTION = "You are Hindustan AI. Speak in Hindi or Chhattisgarhi as requested. Solve Indian problems.";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLastUserPrompt(messages: ChatMessage[]): string | null {
  const lastUserMessage = [...messages]
    .reverse()
    .find((msg) => msg.role === "user" && typeof msg.content === "string");

  return lastUserMessage?.content?.trim() || null;
}

function extractTextFromGeminiResponse(data: any): string {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim() || ""
  );
}

function mapHttpStatusToMessage(status: number, bodyText: string) {
  const lower = bodyText.toLowerCase();
  if (status === 400) return "Gemini request invalid hai.";
  if (status === 401 || status === 403) return "Gemini API key invalid hai.";
  if (status === 404) return "Gemini model nahi mila.";
  if (status === 429 || lower.includes("quota")) return "Gemini rate limit hit ho gayi hai.";
  if (status >= 500) return "Gemini server issue hai.";
  return "Gemini se response laane me error aa gaya.";
}

async function callGeminiWithRetry(prompt: string, apiKey: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              // यहाँ सिस्टम इंस्ट्रक्शन और यूजर प्रॉम्प्ट को जोड़ा गया है
              parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nUser: ${prompt}` }],
            },
          ],
        }),
      });

      const rawText = await response.text();
      let data: any = null;
      try { data = rawText ? JSON.parse(rawText) : null; } catch { data = null; }

      if (!response.ok) {
        const errorMessage = mapHttpStatusToMessage(response.status, rawText);
        if (response.status !== 429 && attempt < MAX_RETRIES) {
          await sleep(attempt * 1500);
          continue;
        }
        throw new Error(errorMessage);
      }

      const text = extractTextFromGeminiResponse(data);
      if (!text) throw new Error("Gemini ne empty response diya.");

      return text;
    } catch (error: any) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw error;
      await sleep(attempt * 1500);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error("Unknown Gemini error");
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing in .env" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const userPrompt = getLastUserPrompt(body.messages);
    if (!userPrompt) {
      return NextResponse.json({ error: "Empty prompt." }, { status: 400 });
    }

    const reply = await callGeminiWithRetry(userPrompt, apiKey);
    return NextResponse.json({ reply }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server Error" }, { status: 500 });
  }
}