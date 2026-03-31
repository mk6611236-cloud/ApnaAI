"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

type ChatDoc = {
  id: string;
  title?: string;
  messages?: { role: string; content: string }[];
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [chatCount, setChatCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const chatsRef = collection(db, "users", currentUser.uid, "chats");
        const snapshot = await getDocs(chatsRef);

        const chats: ChatDoc[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setChatCount(chats.length);

        const totalMessages = chats.reduce((sum, chat) => {
          return sum + (chat.messages?.length || 0);
        }, 0);

        setMessageCount(totalMessages);
      } catch (error) {
        console.error("Profile Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Logout me problem aayi.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-10 w-52 rounded-2xl bg-white/10" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-36 rounded-3xl bg-white/10" />
            <div className="h-36 rounded-3xl bg-white/10" />
            <div className="h-36 rounded-3xl bg-white/10" />
          </div>
          <div className="h-56 rounded-3xl bg-white/10" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/40">
              ApnaAI Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-5xl">
              Profile & Stats
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
              Yahan se tum apne account aur AI usage ka overview dekh sakte ho.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              ← Back to Chat
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>

        {!user ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <h2 className="text-2xl font-bold">Login required</h2>
            <p className="mt-3 text-white/60">
              Profile dekhne ke liye pehle sign in karo.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-105"
            >
              Go to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-sm text-white/50">User</p>
                <h3 className="mt-2 text-xl font-bold">
                  {user.displayName || "ApnaAI User"}
                </h3>
                <p className="mt-2 break-all text-sm text-white/60">
                  {user.email}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-sm text-white/50">Total Chats</p>
                <h3 className="mt-2 text-4xl font-bold">{chatCount}</h3>
                <p className="mt-2 text-sm text-white/60">
                  Tumne jitni chat sessions banayi hain
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-sm text-white/50">Total Messages</p>
                <h3 className="mt-2 text-4xl font-bold">{messageCount}</h3>
                <p className="mt-2 text-sm text-white/60">
                  User + AI messages ka total count
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-sm text-white/50">AI Activity</p>
                <h3 className="mt-2 text-2xl font-bold">ApnaAI Usage</h3>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Tumhara AI app ab user history, profile system aur persistent
                  chat data ke saath ek real product jaisa behave kar raha hai.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/50">Voice</p>
                    <p className="mt-1 text-lg font-semibold">Enabled</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/50">Image Upload</p>
                    <p className="mt-1 text-lg font-semibold">Enabled</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/50">Chat Save</p>
                    <p className="mt-1 text-lg font-semibold">Enabled</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/50">Firebase</p>
                    <p className="mt-1 text-lg font-semibold">Connected</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="text-sm text-white/50">Next Upgrade</p>
                <h3 className="mt-2 text-2xl font-bold">Product Roadmap</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  <li>✅ AI Chat</li>
                  <li>✅ Voice Input + Voice Reply</li>
                  <li>✅ Firebase Auth + Saved Chats</li>
                  <li>✅ Image Upload UI</li>
                  <li>⬜ Real Gemini Vision</li>
                  <li>⬜ AI Tools Marketplace</li>
                  <li>⬜ Subscription / Premium Plan</li>
                  <li>⬜ Admin Panel</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}