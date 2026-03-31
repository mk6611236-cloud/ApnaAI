// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// मनीष भाई, यह ऑफिशियल तरीका है, इसमें URL का कोई झंझट नहीं है
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are Hindustan AI / ApnaAI.
Speak naturally in Hindi or Hinglish.
Solve Indian problems, coding, productivity, startup advice.
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ reply: "API Key missing है। Vercel dashboard चेक करें।" }, { status: 500 });
    }

    const body = await req.json();
    const messages = body?.messages || [];

    if (!messages.length) {
      return NextResponse.json({ reply: "कुछ लिखकर भेजें।" }, { status: 400 });
    }

    // गूगल मॉडल सेटअप
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    // आखिरी मैसेज को उठाना
    const userPrompt = messages[messages.length - 1].content;

    // जवाब जनरेट करना
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser: ${userPrompt}`);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text.trim() });

  } catch (error: any) {
    console.error("Gemini Official Error:", error);
    return NextResponse.json({ 
      reply: "Gemini से जवाब नहीं मिला। शायद API Key या Network में दिक्कत है।" 
    }, { status: 500 });
  }
}