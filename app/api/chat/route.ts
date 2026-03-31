// app/api/chat/route.ts
import { NextResponse } from "next/server";

// मनीष भाई, यहाँ v1beta को हटाकर v1 कर दिया है, अब Google इसे तुरंत पहचान लेगा
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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
  if (msg.includes("api key not valid") || msg.includes("permission denied")) return "Gemini API key sahi nahi lag rahi. Vercel dashboard check karein.";
  if (msg.includes("quota") || msg.includes("rate limit")) return "Aaj ka Gemini limit khatam ho gaya. Thodi der baad phir try karo.";
  return "Gemini se abhi response nahi mila. Network issue ho sakta hai.";
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ reply: "API Key missing hai. Vercel dashboard check karein." }, { status: 500 });
    }

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];

    if (!messages.length) {
      return NextResponse.json({ reply: "Kuch likhkar bhejo." }, { status: 400 });
    }

    const prompt = buildPrompt(messages);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); 

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

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Response nahi mila.";
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Server Error:", error);
    if (error?.name === "AbortError") {
      return NextResponse.json({ reply: "Request slow hai. Dobara try karein." }, { status: 500 });
    }
    return NextResponse.json({ reply: "Server issue. Ek baar refresh karke try karein." }, { status: 500 });
  }
}