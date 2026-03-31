export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="mt-2 text-white/60">Start using ApnaAI for free</p>

        <form className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />
          <button className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black">
            Sign Up
          </button>
        </form>
      </div>
    </main>
  );
}