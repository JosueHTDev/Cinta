"use client";

import { useState } from "react";

export type Status = "idle" | "uploading" | "processing" | "done" | "error";

const STATUS_LABEL: Record<Status, string> = {
  idle: "En espera",
  uploading: "Enviando audio",
  processing: "Transcribiendo",
  done: "Completado",
  error: "Error",
};

function wordCount(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function downloadTxt(text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transcripcion-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TranscriptView({
  status,
  transcript,
  errorMessage,
}: {
  status: Status;
  transcript: string;
  errorMessage?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const busy = status === "uploading" || status === "processing";

  return (
    <div className="flex h-full flex-col rounded-[3px] border border-line bg-panel">
      <div className="sprocket-edge h-2 w-full rounded-t-[3px]" />

      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "error"
                ? "bg-red"
                : busy
                ? "bg-gold animate-pulse"
                : status === "done"
                ? "bg-gold"
                : "bg-faint"
            }`}
          />
          <span className="font-label text-[12px] font-semibold uppercase tracking-[0.18em] text-faint">
            {STATUS_LABEL[status]}
          </span>
        </div>
        {transcript && (
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-faint">
              {wordCount(transcript)} palabras
            </span>
            <button
              onClick={() => downloadTxt(transcript)}
              className="font-label text-[12px] font-semibold uppercase tracking-[0.1em] text-muted transition-colors hover:text-red"
            >
              Descargar
            </button>
            <button
              onClick={copy}
              className="font-label text-[12px] font-semibold uppercase tracking-[0.1em] text-muted transition-colors hover:text-red"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {status === "error" ? (
          <p className="text-sm text-red">{errorMessage || "Algo salió mal. Intenta de nuevo."}</p>
        ) : transcript ? (
          <p className="animate-rise whitespace-pre-wrap font-mono text-[15px] leading-relaxed text-text">
            {transcript}
          </p>
        ) : busy ? (
          <div className="flex h-full items-center">
            <div className="flex items-center gap-3 text-sm text-muted">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              {STATUS_LABEL[status]}…
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-faint">Aquí aparecerá lo que se dijo en el audio.</p>
        )}
      </div>
    </div>
  );
}
