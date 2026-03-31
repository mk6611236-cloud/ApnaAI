// app/api/chat/route.ts
import { NextResponse } from "next/server";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// System prompt ko add kiya jaaye
const SYSTEM_PROMPT = `
You are Hindustan AI / ApnaAI.
Speak naturally in Hindi or Hinglish.
Solve Indian problems, coding, productivity, startup advice.
`;

function buildPrompt(messages: ChatMessage[]) {
  const conversation = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `
${SYSTEM_PROMPT}

Conversation:
${conversation}

Assistant:
`.trim();
}

function getFriendlyError(apiErrorMessage?: string) {
  const msg = (apiErrorMessage || "").toLowerCase();

  if (msg.includes("high demand")) return "Gemini par abhi bahut load hai. 1-2 min baad try karo.";
  if (msg.includes("api key not valid") || msg.includes("permission denied")) return "Gemini API key sahi nahi lag rahi. .env.local check karo.";
  if (msg.includes("quota") || msg.includes("rate limit")) return "Aaj ka Gemini limit khatam ho gaya. Thodi der baad phir try karo.";
  if (msg.includes("not found") || msg.includes("model")) return "Gemini model issue hai. Backend config check karo.";
  return "Gemini se abhi response nahi mila. Thodi der baad try karo.";
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return NextResponse.json({ reply: "GEMINI_API_KEY .env.local me missing hai." }, { status: 500 });

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];

    if (!messages.length)
      return NextResponse.json({ reply: "Koi message nahi mila. Kuch likhkar bhejo." }, { status: 400 });

    const prompt = buildPrompt(messages);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json({ reply: getFriendlyError(data?.error?.message) }, { status: 500 });
    }

    // Streamlit style: .text check
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Koi response nahi mila. Dobara try karo.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Gemini REST API Error:", error);
    if (error?.name === "AbortError") {
      return NextResponse.json({ reply: "Request slow ho gaya. Dobara bhejo." }, { status: 500 });
    }
    return NextResponse.json({ reply: "Server error aaya. Gemini API request fail hui." }, { status: 500 });
  }
}