import Link from "next/link";

const features = [
  {
    title: "Startup AI",
    desc: "Idea, business plan, monetization aur launch strategy Hindi me.",
    emoji: "🚀",
  },
  {
    title: "Coding AI",
    desc: "Code, debugging, app banana aur tech help simple language me.",
    emoji: "💻",
  },
  {
    title: "Study AI",
    desc: "Padhai, exam prep, notes aur concept explanation easy Hindi me.",
    emoji: "📚",
  },
  {
    title: "Growth AI",
    desc: "Marketing, content, YouTube, Instagram aur business growth help.",
    emoji: "📈",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 md:px-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ApnaAI 🇮🇳</h1>
            <p className="mt-1 text-sm text-white/60">
              Bharat-first AI assistant
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20"
            >
              Profile
            </Link>

            <Link
              href="/chat"
              className="rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20"
            >
              Open Chat
            </Link>
          </div>
        </header>

        <div className="flex flex-1 items-center py-16 md:py-24">
          <div className="grid w-full items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                Built for India • Hindi + Hinglish AI
              </div>

              <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
                Bharat ka apna AI assistant
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                Startup, coding, padhai, business growth aur daily life ke liye
                ek smart AI jo Hindi aur Hinglish me natural jawab deta hai.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/chat"
                  className="rounded-2xl bg-white px-6 py-4 text-sm font-bold text-black transition hover:scale-105"
                >
                  Start Chatting
                </Link>

                <a
                  href="#features"
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  See Features
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Hindi First
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Voice Ready
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Startup Friendly
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-black">
                    Mere liye ek AI startup idea banao jo Bharat me chale.
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/90">
                    Bilkul! Ek strong idea hai: <b>"Gaon Commerce AI"</b> —
                    chhote shahron aur gaon ke dukandaron ke liye AI business
                    assistant...
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-black">
                    Mujhe Next.js app banana sikhao.
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/90">
                    Chalo step-by-step karte hain — folder setup se deployment tak.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="pb-10">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50">
              Features
            </p>
            <h3 className="mt-3 text-3xl font-bold md:text-4xl">
              Ek app, multiple AI helpers
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="mb-4 text-3xl">{feature.emoji}</div>
                <h4 className="text-xl font-semibold">{feature.title}</h4>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}