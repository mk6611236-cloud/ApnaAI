export default function Sidebar() {
  return (
    <aside className="hidden w-72 border-r border-white/10 bg-black/20 p-4 md:block">
      <button className="mb-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black">
        + New Chat
      </button>

      <div className="space-y-2">
        {["Welcome Chat", "Startup Idea", "Coding Help"].map((item) => (
          <div
            key={item}
            className="cursor-pointer rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
          >
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}