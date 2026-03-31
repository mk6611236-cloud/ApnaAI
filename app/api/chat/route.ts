// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// मनीष भाई, Playground पर जो Key चली, वही यहाँ काम करेगी
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: "API Key missing hai." }, { status: 500 });

    const body = await req.json();
    const messages = body?.messages || [];
    const userPrompt = messages[messages.length - 1]?.content || "Hii";

    // मनीष भाई, Playground पर gemini-1.5-flash चला है, हम वही यहाँ लिख रहे हैं
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text.trim() });

  } catch (error: any) {
    console.error("SDK Error:", error);
    return NextResponse.json({ reply: "Google se connection slow hai. Ek baar refresh karein." }, { status: 500 });
  }
}