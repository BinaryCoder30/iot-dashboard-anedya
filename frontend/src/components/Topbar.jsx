const roleBadgeColor = {
  Admin: "bg-red-500/20 text-red-400 border-red-500/30",
  Operator: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Viewer: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function Topbar({ title }) {
  const role = localStorage.getItem("role") || "Viewer";
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <header className="h-16 bg-[#0a0f1e]/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-6">
      <div>
        <h1 className="text-white font-semibold text-lg leading-none" style={{ fontFamily: "'Exo 2', sans-serif" }}>{title}</h1>
        <p className="text-slate-500 text-xs mt-0.5">{now}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-widest ${roleBadgeColor[role] || roleBadgeColor.Viewer}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {role}
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {role.charAt(0)}
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap');`}</style>
    </header>
  );
}