"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
  image?: string | null;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  mode?: ToolModeId;
};

type ToolModeId = "startup" | "coding" | "study" | "marketing" | "bharat";

type ToolPreset = {
  id: ToolModeId;
  label: string;
  emoji: string;
  prompt: string;
  system: string;
  suggestions: string[];
};

type SpeechRecognitionType = typeof window extends undefined ? never : any;

const STORAGE_KEY = "apnaai_chat_sessions";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Namaste! Main ApnaAI hoon 🇮🇳\nAap Startup, Coding, Study, Marketing ya Bharat Help mode me kaam kar sakte ho.",
};

const TOOL_PRESETS: ToolPreset[] = [
  {
    id: "bharat",
    label: "Bharat Help",
    emoji: "🇮🇳",
    prompt: "Mujhe India-focused practical advice do.",
    system: "Tum Bharat Help AI ho. Hindi ya Hinglish me relatable jawab do.",
    suggestions: ["Startup idea do", "Study tips", "Skill kaise sikhe"],
  },
  {
    id: "coding",
    label: "Coding AI",
    emoji: "💻",
    prompt: "Coding me help karo.",
    system: "Tum Coding AI ho. Clear aur structured code blocks ke saath answer do.",
    suggestions: ["Next.js setup", "React hooks", "Firebase fix"],
  }
];

const QUICK_PROMPTS = ["Start business idea", "Coding help", "Study notes"];

function createNewSession(mode: ToolModeId = "bharat"): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [WELCOME_MESSAGE],
    createdAt: Date.now(),
    mode,
  };
}

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let index = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, index + 1));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);
  return <p className="whitespace-pre-wrap text-sm leading-7">{displayed}</p>;
}

export default function ChatBox() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnimatedReply, setLastAnimatedReply] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
          const newSession = createNewSession();
          setSessions([newSession]);
          setActiveChatId(newSession.id);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeChatId, loading]);

  const activeSession = sessions.find((s) => s.id === activeChatId) || sessions[0];
  const messages = activeSession?.messages || [WELCOME_MESSAGE];

  // --- यह रहा वो फंक्शन जो पहले गायब था ---
  const createChat = (mode: ToolModeId = "bharat") => {
    const newSession = createNewSession(mode);
    setSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setSidebarOpen(false);
    setInput("");
  };

  const callChatApi = async (payloadMessages: Message[]) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });
      const data = await res.json();
      return data.reply || "Error: Response nahi mila.";
    } catch (error) {
      return "Network Issue. Check internet connection.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];

    const updatedSessions = sessions.map(s => 
      s.id === activeChatId ? { ...s, messages: updatedMessages } : s
    );
    setSessions(updatedSessions);
    setInput("");
    setLoading(true);

    const reply = await callChatApi(updatedMessages);
    setLastAnimatedReply(reply);

    setSessions(prev => prev.map(s => 
      s.id === activeChatId ? { ...s, messages: [...updatedMessages, { role: "assistant", content: reply }] } : s
    ));
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className={`w-64 border-r border-white/10 p-4 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <button onClick={() => createChat()} className="w-full bg-white text-black py-2 rounded-xl font-bold mb-4">+ New Chat</button>
        <div className="overflow-y-auto h-[70vh]">
          {sessions.map(s => (
            <div key={s.id} onClick={() => setActiveChatId(s.id)} className={`p-2 mb-2 rounded-lg cursor-pointer ${activeChatId === s.id ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              {s.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-white/10 flex justify-between items-center">
          <h1 className="text-xl font-bold">🇮🇳 ApnaAI</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-sm border border-white/20 px-3 py-1 rounded-lg">Menu</button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                {m.role === 'assistant' && i === messages.length - 1 && m.content === lastAnimatedReply ? (
                  <TypingText text={m.content} />
                ) : (
                  <p className="text-sm">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs opacity-50">ApnaAI soch raha hai...</div>}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 border-t border-white/10 bg-zinc-950">
          <div className="max-w-4xl mx-auto flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Kuch bhi pucho..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none resize-none"
              rows={1}
            />
            <button 
              onClick={sendMessage} 
              disabled={loading || !input.trim()}
              className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}