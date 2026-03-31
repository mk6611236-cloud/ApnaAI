"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";
import AuthModal from "@/components/AuthModal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";

export default function ChatPage() {
  const [openAuth, setOpenAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // New state for Dark/Light mode
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Load user authentication
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("apnaai_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("apnaai_theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main
      className={`min-h-screen text-white ${
        theme === "dark"
          ? "bg-gradient-to-br from-black via-zinc-950 to-zinc-900"
          : "bg-gradient-to-br from-white via-gray-100 to-gray-200 text-black"
      }`}
    >
      <header
        className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl ${
          theme === "dark" ? "bg-black/50" : "bg-white/30"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div>
            <p
              className={`text-[10px] uppercase tracking-[0.35em] md:text-xs ${
                theme === "dark" ? "text-white/40" : "text-black/40"
              }`}
            >
              Bharat First AI
            </p>
            <h1
              className={`text-2xl font-bold tracking-tight md:text-3xl ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              ApnaAI Chat 🇮🇳
            </h1>
            <p
              className={`mt-1 text-xs md:text-sm ${
                theme === "dark" ? "text-white/50" : "text-black/50"
              }`}
            >
              Hindi + Hinglish AI assistant for Bharat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                theme === "dark"
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-black/5 text-black hover:bg-black/10"
              }`}
            >
              Home
            </Link>

            <Link
              href="/profile"
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                theme === "dark"
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-black/5 text-black hover:bg-black/10"
              }`}
            >
              Profile
            </Link>

            {/* Dark/Light mode toggle button */}
            <button
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                theme === "dark"
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-black/5 text-black hover:bg-black/10"
              }`}
            >
              {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </button>

            {user ? (
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`rounded-2xl border px-4 py-2 text-xs font-semibold md:text-sm ${
                    theme === "dark"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-emerald-700/20 bg-emerald-200 text-emerald-900"
                  }`}
                >
                  {user.displayName || user.email || "Logged In"}
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                    theme === "dark"
                      ? "border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                      : "border-red-700/20 bg-red-200 text-red-900 hover:bg-red-300"
                  }`}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOpenAuth(true)}
                className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                  theme === "dark"
                    ? "bg-white text-black hover:scale-105"
                    : "bg-black text-white hover:scale-105"
                }`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col">
        <ChatBox />
      </section>

      <AuthModal open={openAuth} onClose={() => setOpenAuth(false)} />
    </main>
  );
}