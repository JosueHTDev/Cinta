"use client";

export type HistoryEntry = {
  id: string;
  label: string;
  transcript: string;
  createdAt: number;
};

function downloadTxt(entry: HistoryEntry) {
  const blob = new Blob([entry.transcript], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${entry.label.replace(/\.[^/.]+$/, "")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatWhen(ts: number) {
  return new Date(ts).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryList({
  entries,
  onSelect,
}: {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-[3px] border border-line bg-panel">
      <div className="border-b border-line px-4 py-2.5">
        <p className="font-label text-[12px] font-semibold uppercase tracking-[0.18em] text-faint">
          Historial de esta sesión
        </p>
      </div>
      <ul className="max-h-56 overflow-y-auto divide-y divide-line">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
            <button
              onClick={() => onSelect(entry)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate font-mono text-[12px] text-text">{entry.transcript}</p>
              <p className="font-mono text-[10px] text-faint">
                {entry.label} · {formatWhen(entry.createdAt)}
              </p>
            </button>
            <button
              onClick={() => downloadTxt(entry)}
              aria-label={`Descargar transcripción de ${entry.label}`}
              className="shrink-0 text-faint transition-colors hover:text-red"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
