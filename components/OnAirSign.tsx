"use client";

export default function OnAirSign({ active }: { active: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-[3px] border-2 px-3 py-1 transition-all duration-300
        ${
          active
            ? "border-redBright bg-redBright shadow-[0_0_18px_rgba(232,73,46,0.45)] animate-flicker"
            : "border-line bg-transparent"
        }`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-panel" : "bg-faint"}`}
      />
      <span
        className={`font-label text-[13px] font-bold uppercase tracking-[0.16em] ${
          active ? "text-panel" : "text-faint"
        }`}
      >
        Al aire
      </span>
    </div>
  );
}
