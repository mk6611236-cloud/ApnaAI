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
    "Namaste! Main ApnaAI hoon 🇮🇳\nAap Startup, Coding, Study, Marketing ya Bharat Help mode me kaam kar sakte ho.\nPhoto ya screenshot bhi bhej sakte ho.",
};

const TOOL_PRESETS: ToolPreset[] = [
  {
    id: "startup",
    label: "Startup AI",
    emoji: "🚀",
    prompt:
      "Mujhe ek startup idea do jo Bharat me kaam kare. Problem, solution, target users, revenue model aur launch plan bhi do.",
    system:
      "Tum Startup AI ho. Bharat-focused startup advisor ki tarah jawab do. Problem validation, MVP, revenue model, launch strategy aur practical execution par focus karo. Hindi ya Hinglish me short but useful jawab do.",
    suggestions: [
      "Ek profitable startup idea do",
      "Mere idea ka business model banao",
      "MVP ka launch plan do",
      "Pitch deck points likho",
    ],
  },
  {
    id: "coding",
    label: "Coding AI",
    emoji: "💻",
    prompt:
      "Mujhe coding me help karo. Problem ko simple Hindi me samjhao aur step-by-step solution do.",
    system:
      "Tum Coding AI ho. Debugging, code explanation, app architecture aur practical coding help do. Hindi ya Hinglish me clear aur structured answer do. Jab relevant ho, code blocks do.",
    suggestions: [
      "Mujhe Next.js app banana sikhao",
      "Mera error fix karo",
      "Login system ka code do",
      "Firebase setup samjhao",
    ],
  },
  {
    id: "study",
    label: "Study AI",
    emoji: "📚",
    prompt:
      "Mujhe kisi topic ko Hindi me asaan tarike se samjhao, examples ke saath.",
    system:
      "Tum Study AI ho. Kisi bhi topic ko simple Hindi me teacher ki tarah samjhao. Examples, short notes, revision points aur exam-friendly explanation do.",
    suggestions: [
      "Physics ka koi topic samjhao",
      "Exam ke liye short notes banao",
      "English grammar simple me samjhao",
      "Career options batao",
    ],
  },
  {
    id: "marketing",
    label: "Growth AI",
    emoji: "📈",
    prompt:
      "Mere product ke liye marketing strategy banao. Instagram, YouTube aur WhatsApp growth plan bhi do.",
    system:
      "Tum Growth AI ho. Marketing, content, audience growth, social media aur conversion par focus karo. Bharat aur Hindi audience ke liye practical strategy do.",
    suggestions: [
      "Instagram growth strategy do",
      "YouTube channel idea do",
      "WhatsApp marketing plan banao",
      "Content calendar banao",
    ],
  },
  {
    id: "bharat",
    label: "Bharat Help",
    emoji: "🇮🇳",
    prompt:
      "Mujhe India-focused practical advice do jo small town aur Hindi audience ke liye useful ho.",
    system:
      "Tum Bharat Help AI ho. Bharat ke students, founders, creators aur small-town users ke liye practical advice do. Hindi ya Hinglish me relatable aur realistic jawab do.",
    suggestions: [
      "Small town business ideas do",
      "India me skill kaise sikhe",
      "Paise kamane ke tareeke batao",
      "Village users ke liye app idea do",
    ],
  },
];

const QUICK_PROMPTS = [
  "Mere liye ek AI startup idea banao",
  "Mujhe Next.js app banana sikhao",
  "10th/12th ke baad best career options batao",
  "Mera business grow kaise hoga?",
  "Ek YouTube channel idea do",
  "Daily productivity plan banao",
];

function isBusyMessage(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("slow") ||
    t.includes("busy") ||
    t.includes("high demand") ||
    t.includes("try karo") ||
    t.includes("load")
  );
}

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

function getModeConfig(mode: ToolModeId) {
  return TOOL_PRESETS.find((tool) => tool.id === mode) || TOOL_PRESETS[4];
}

export default function ChatBox() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnimatedReply, setLastAnimatedReply] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchChat, setSearchChat] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const chatRef = collection(db, "users", currentUser.uid, "chats");
        const q = query(chatRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const firebaseChats: ChatSession[] = snapshot.docs.map((chatDoc) => ({
          id: chatDoc.id,
          title: chatDoc.data().title || "New Chat",
          messages: chatDoc.data().messages || [WELCOME_MESSAGE],
          createdAt: chatDoc.data().createdAt?.seconds
            ? chatDoc.data().createdAt.seconds * 1000
            : Date.now(),
          mode: chatDoc.data().mode || "bharat",
        }));

        if (firebaseChats.length) {
          setSessions(firebaseChats);
          setActiveChatId(firebaseChats[0].id);
        } else {
          const newSession = createNewSession();
          setSessions([newSession]);
          setActiveChatId(newSession.id);
        }
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed: ChatSession[] = JSON.parse(saved);
          setSessions(parsed);
          setActiveChatId(parsed[0]?.id || "");
        } else {
          const newSession = createNewSession();
          setSessions([newSession]);
          setActiveChatId(newSession.id);
        }
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user && sessions.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeChatId, loading]);

  const activeSession =
    sessions.find((session) => session.id === activeChatId) || sessions[0];

  const activeMode = activeSession?.mode || "bharat";
  const activeModeConfig = getModeConfig(activeMode);
  const messages = activeSession?.messages || [WELCOME_MESSAGE];

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchChat.toLowerCase())
  );

  const lastAssistantMessage = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find((m) => m.role === "assistant")?.content ?? "";
  }, [messages]);

  const showRetry = !loading && isBusyMessage(lastAssistantMessage);

  const speakText = (text: string) => {
    if (
      !voiceEnabled ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const saveChatToFirebase = async (session: ChatSession) => {
    if (!user) return;

    try {
      const chatDocRef = doc(db, "users", user.uid, "chats", session.id);

      await setDoc(
        chatDocRef,
        {
          title: session.title,
          messages: session.messages,
          createdAt: serverTimestamp(),
          mode: session.mode || "bharat",
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Firebase Save Error:", error);
    }
  };

  const deleteChat = async (chatId: string) => {
    const remaining = sessions.filter((session) => session.id !== chatId);
    setSessions(remaining);

    if (remaining.length) {
      setActiveChatId(remaining[0].id);
    } else {
      const newSession = createNewSession();
      setSessions([newSession]);
      setActiveChatId(newSession.id);
    }

    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "chats", chatId));
      } catch (error) {
        console.error("Delete Chat Error:", error);
      }
    }
  };

  const clearAllChats = async () => {
    const confirmClear = confirm("Kya aap saare chats delete karna chahte ho?");
    if (!confirmClear) return;

    if (user) {
      try {
        await Promise.all(
          sessions.map((session) =>
            deleteDoc(doc(db, "users", user.uid, "chats", session.id))
          )
        );
      } catch (error) {
        console.error("Clear All Chats Error:", error);
      }
    }

    const newSession = createNewSession(activeMode);
    setSessions([newSession]);
    setActiveChatId(newSession.id);

    if (user) {
      await saveChatToFirebase(newSession);
    }
  };

  const renameChat = async (chatId: string, currentTitle: string) => {
    const newTitle = prompt("Chat ka naya naam likho:", currentTitle)?.trim();
    if (!newTitle) return;

    const updatedSessions = sessions.map((session) =>
      session.id === chatId ? { ...session, title: newTitle } : session
    );

    setSessions(updatedSessions);

    const updatedSession = updatedSessions.find((session) => session.id === chatId);
    if (updatedSession && user) {
      await saveChatToFirebase(updatedSession);
    }
  };

  const updateActiveSession = async (updates: Partial<ChatSession>) => {
    const updatedSessions = sessions.map((session) =>
      session.id === activeChatId ? { ...session, ...updates } : session
    );

    setSessions(updatedSessions);

    const updatedSession = updatedSessions.find(
      (session) => session.id === activeChatId
    );

    if (updatedSession && user) {
      await saveChatToFirebase(updatedSession);
    }
  };

  const getFormattedChatText = () => {
    if (!activeSession) return "";

    const formattedChat = activeSession.messages
      .map((message) => {
        const speaker = message.role === "user" ? "You" : "ApnaAI";
        return `${speaker}:\n${message.content}\n`;
      })
      .join("\n----------------------\n\n");

    return `ApnaAI Chat Export
Title: ${activeSession.title}
Mode: ${activeModeConfig.label}
Date: ${new Date().toLocaleString()}

========================================

${formattedChat}
`;
  };

  const downloadCurrentChat = () => {
    if (!activeSession) return;

    const fileContent = getFormattedChatText();
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSession.title.replace(/\s+/g, "_") || "apnaai_chat"}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const copyCurrentChat = async () => {
    if (!activeSession) return;

    try {
      await navigator.clipboard.writeText(getFormattedChatText());
      alert("Chat copy ho gaya 📋");
    } catch {
      alert("Copy nahi ho paya.");
    }
  };

  const shareCurrentChat = async () => {
    if (!activeSession) return;

    const shareText = getFormattedChatText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeSession.title || "ApnaAI Chat",
          text: shareText,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      alert("Chat share ke liye copy ho gaya 📤");
    } catch {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const callChatApi = async (payloadMessages: Message[], mode: ToolModeId) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: payloadMessages,
        systemPrompt: getModeConfig(mode).system,
        mode,
      }),
    });

    const data = await res.json();

    return (
      data.reply ||
      "Abhi response nahi mila. Thodi der baad phir try karo."
    );
  };

  const sendMessage = async (customInput?: string) => {
    const text = (customInput ?? input).trim();
    if ((!text && !selectedImage) || loading || !activeSession) return;

    stopSpeaking();

    const imageNotice = selectedImage
      ? "\n\n[User ne ek image / screenshot upload kiya hai. Is image ko context ke roop me consider karo.]"
      : "";

    const finalUserContent = `${text || "Is image ko samjhao."}${imageNotice}`;

    const userMessage: Message = {
      role: "user",
      content: finalUserContent,
      image: selectedImage,
    };

    const updatedMessages = [...messages, userMessage];
    const newTitle =
      activeSession.title === "New Chat"
        ? (text || activeModeConfig.label).slice(0, 30)
        : activeSession.title;

    await updateActiveSession({
      messages: updatedMessages,
      title: newTitle,
    });

    setInput("");
    setLoading(true);
    setLastPrompt(finalUserContent);
    setSelectedImage(null);

    try {
      const reply = await callChatApi(updatedMessages, activeMode);
      setLastAnimatedReply(reply);

      await updateActiveSession({
        messages: [...updatedMessages, { role: "assistant", content: reply }],
        title: newTitle,
      });

      speakText(reply);
    } catch {
      await updateActiveSession({
        messages: [
          ...updatedMessages,
          {
            role: "assistant",
            content: "Network ya server issue aaya. Thodi der baad phir try karo.",
          },
        ],
        title: newTitle,
      });
    } finally {
      setLoading(false);
    }
  };

  const retryLastMessage = async () => {
    if (!lastPrompt || loading || !activeSession) return;

    stopSpeaking();

    const retryMessages: Message[] = [
      ...messages.filter(
        (m, i) =>
          !(
            i === messages.length - 1 &&
            m.role === "assistant"
          ) &&
          !(
            m.role === "user" &&
            m.content === lastPrompt &&
            i === messages.length - 2
          )
      ),
      { role: "user", content: lastPrompt },
    ];

    await updateActiveSession({ messages: retryMessages });
    setLoading(true);

    try {
      const reply = await callChatApi(retryMessages, activeMode);
      setLastAnimatedReply(reply);

      await updateActiveSession({
        messages: [...retryMessages, { role: "assistant", content: reply }],
      });

      speakText(reply);
    } catch {
      await updateActiveSession({
        messages: [
          ...retryMessages,
          {
            role: "assistant",
            content: "Retry me bhi server issue aaya. Thodi der baad phir try karo.",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Aapke browser me voice input support nahi hai.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const createChat = async (mode: ToolModeId = activeMode) => {
    stopSpeaking();

    const newSession = createNewSession(mode);
    setSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setSidebarOpen(false);
    setInput("");
    setLastPrompt("");
    setLastAnimatedReply("");
    setSelectedImage(null);

    if (user) {
      await saveChatToFirebase(newSession);
    }
  };

  const switchMode = async (mode: ToolModeId) => {
    if (!activeSession) return;
    await updateActiveSession({ mode });
    setInput(getModeConfig(mode).prompt);
    setSidebarOpen(false);
  };

  const applyPreset = (prompt: string) => {
    setInput(prompt);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Sirf image file upload karo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex h-[calc(100vh-81px)] flex-1 overflow-hidden">
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-[81px] z-50 h-[calc(100vh-81px)] w-80 transform border-r border-white/10 bg-zinc-950 p-4 transition-transform duration-300 md:static md:z-auto md:flex md:translate-x-0 md:flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => createChat(activeMode)}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
        >
          + New Chat
        </button>

        <button
          onClick={clearAllChats}
          className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          🗑 Clear All Chats
        </button>

        <div className="mt-5">
          <input
            value={searchChat}
            onChange={(e) => setSearchChat(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
          />
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            AI Tools
          </h3>

          <div className="space-y-2">
            {TOOL_PRESETS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => switchMode(tool.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  activeMode === tool.id
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{tool.emoji}</span>
                <div>
                  <div className="font-semibold">{tool.label}</div>
                  <div className="text-xs opacity-70">Tap to switch mode</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            Current Mode
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeModeConfig.emoji}</span>
            <div>
              <div className="font-semibold text-white">{activeModeConfig.label}</div>
              <div className="text-xs text-white/60">Smart workflow enabled</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {activeModeConfig.suggestions.map((item) => (
              <button
                key={item}
                onClick={() => applyPreset(item)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-white/80 transition hover:bg-white/10"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 min-h-0 flex-1">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            Chat History
          </h3>

          <div className="space-y-2 overflow-y-auto pr-1">
            {filteredSessions.map((session) => {
              const sessionMode = getModeConfig(session.mode || "bharat");

              return (
                <div
                  key={session.id}
                  className={`group rounded-2xl px-2 py-2 transition ${
                    activeChatId === session.id
                      ? "bg-white text-black"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <button
                    onClick={() => {
                      stopSpeaking();
                      setActiveChatId(session.id);
                      setSidebarOpen(false);
                    }}
                    className="w-full rounded-xl px-2 py-2 text-left text-sm"
                  >
                    <div className="truncate font-medium">
                      {sessionMode.emoji} {session.title}
                    </div>
                    <div className="mt-1 text-xs opacity-60">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </button>

                  <div className="mt-2 flex gap-2 px-2 pb-1">
                    <button
                      onClick={() => renameChat(session.id, session.title)}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        activeChatId === session.id
                          ? "bg-black/10 text-black hover:bg-black/20"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      ✏ Rename
                    </button>

                    <button
                      onClick={() => deleteChat(session.id)}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        activeChatId === session.id
                          ? "bg-black/10 text-black hover:bg-black/20"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-white/10 px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 md:hidden"
            >
              ☰ Menu
            </button>

            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => applyPreset(prompt)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10"
              >
                {prompt}
              </button>
            ))}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={shareCurrentChat}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
              >
                📤 Share
              </button>

              <button
                onClick={copyCurrentChat}
                className="rounded-full border border-violet-500/30 bg-violet-500/20 px-4 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/30"
              >
                📋 Copy
              </button>

              <button
                onClick={downloadCurrentChat}
                className="rounded-full border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/30"
              >
                ⬇ Download
              </button>

              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
                {activeModeConfig.emoji} {activeModeConfig.label}
              </span>

              <button
                onClick={() => setVoiceEnabled((prev) => !prev)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  voiceEnabled
                    ? "border border-green-500/30 bg-green-500/20 text-green-300"
                    : "border border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
              </button>

              {speaking && (
                <button
                  onClick={stopSpeaking}
                  className="rounded-full border border-red-500/30 bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
                >
                  ⏹ Stop Voice
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const isLastAssistant =
                message.role === "assistant" &&
                index === messages.length - 1 &&
                message.content === lastAnimatedReply;

              return (
                <div
                  key={index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-3xl px-5 py-4 shadow-lg ${
                      isUser
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white backdrop-blur"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider opacity-60">
                      <span>{isUser ? "You" : activeModeConfig.label}</span>

                      {!isUser && (
                        <button
                          onClick={() => speakText(message.content)}
                          className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-white hover:bg-white/20"
                        >
                          🔊 Play
                        </button>
                      )}
                    </div>

                    {message.image && (
                      <div className="mb-3 overflow-hidden rounded-2xl border border-black/10">
                        <Image
                          src={message.image}
                          alt="Uploaded"
                          width={500}
                          height={300}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    )}

                    {isLastAssistant ? (
                      <TypingText text={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white backdrop-blur">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-60">
                    {activeModeConfig.label}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/70" />
                    </span>
                    <span>{activeModeConfig.label} soch raha hai...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {showRetry && !loading && (
          <div className="px-4 pb-3 md:px-8">
            <div className="mx-auto flex max-w-4xl items-center justify-between rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              <span>Gemini abhi busy lag raha hai. Dobara try kar sakte ho.</span>
              <button
                onClick={retryLastMessage}
                className="rounded-xl bg-yellow-300 px-4 py-2 font-semibold text-black transition hover:scale-105"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 bg-black/20 px-4 py-4 backdrop-blur md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            {selectedImage && (
              <div className="mb-3 rounded-3xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/80">
                    Selected Image
                  </p>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200"
                  >
                    Remove
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={selectedImage}
                    alt="Selected preview"
                    width={500}
                    height={300}
                    className="h-auto max-h-72 w-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="mb-3 flex flex-wrap gap-2">
              {activeModeConfig.suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => applyPreset(item)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
              <button
                onClick={listening ? stopListening : startListening}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  listening
                    ? "bg-red-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {listening ? "🎙️ Listening..." : "🎤 Mic"}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                🖼 Upload
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${activeModeConfig.label}...`}
                className="max-h-40 min-h-[56px] flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-7 text-white placeholder:text-white/40 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !selectedImage)}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>

          <p className="mx-auto mt-3 max-w-4xl text-center text-xs text-white/40">
            ApnaAI beta me hai • Smart AI Modes enabled • Voice input/output browser support par depend karta hai
          </p>
        </div>
      </div>
    </div>
  );
}