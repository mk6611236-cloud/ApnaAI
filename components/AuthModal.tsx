"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error: any) {
      alert(error.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      alert("Email aur password dono bharna zaroori hai.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      onClose();
    } catch (error: any) {
      alert(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              ApnaAI Auth
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {mode === "login"
                ? "Login karke apni chats save karo."
                : "Naya account banao aur ApnaAI use karo."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Continue with Google"}
          </button>

          <div className="relative py-2 text-center text-xs text-white/40">
            <span className="bg-zinc-950 px-3">OR</span>
            <div className="absolute left-0 top-1/2 -z-10 h-px w-full bg-white/10" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
            />
          </div>

          <button
            onClick={handleEmailAuth}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:scale-[1.02] disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-white/60">
          {mode === "login" ? "New user?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-white underline underline-offset-4"
          >
            {mode === "login" ? "Create account" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}