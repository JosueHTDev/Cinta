"use client";

import { useCallback, useEffect, useState } from "react";
import Recorder from "@/components/Recorder";
import Uploader from "@/components/Uploader";
import TranscriptView, { Status } from "@/components/TranscriptView";
import OnAirSign from "@/components/OnAirSign";
import ThemeToggle from "@/components/ThemeToggle";
import HistoryList, { HistoryEntry } from "@/components/HistoryList";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;
const HISTORY_KEY = "cinta-history";
const HISTORY_LIMIT = 12;

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // Historial no disponible; se empieza vacío.
    }
  }, []);

  const saveHistory = (next: HistoryEntry[]) => {
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Si falla, la sesión sigue funcionando sin persistencia.
    }
  };

  const reset = () => {
    setTranscript("");
    setErrorMessage(null);
  };

  const pollOperation = useCallback(
    async (operationName: string, name: string) => {
      const startedAt = Date.now();

      const poll = async (): Promise<void> => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setStatus("error");
          setErrorMessage("La transcripción tardó demasiado. Intenta con un audio más corto.");
          return;
        }
        try {
          const res = await fetch(`/api/transcribe?name=${encodeURIComponent(operationName)}`);
          const data = await res.json();

          if (!res.ok) {
            setStatus("error");
            setErrorMessage(data.error || "No se pudo obtener la transcripción.");
            return;
          }

          if (data.done) {
            setStatus("done");
            const text = data.transcript || "No se detectó voz en el audio.";
            setTranscript(text);
            if (data.transcript) {
              const entry: HistoryEntry = {
                id: `${Date.now()}`,
                label: name,
                transcript: text,
                createdAt: Date.now(),
              };
              saveHistory([entry, ...history].slice(0, HISTORY_LIMIT));
            }
            return;
          }

          window.setTimeout(poll, POLL_INTERVAL_MS);
        } catch {
          setStatus("error");
          setErrorMessage("Se perdió la conexión mientras se transcribía.");
        }
      };

      poll();
    },
    [history]
  );

  const sendAudio = useCallback(
    async (blob: Blob, name: string) => {
      reset();
      setFileName(name);
      setStatus("uploading");

      try {
        const form = new FormData();
        form.append("audio", blob, name);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data.error || "No se pudo enviar el audio.");
          return;
        }

        setStatus("processing");
        pollOperation(data.operationName, name);
      } catch {
        setStatus("error");
        setErrorMessage("No se pudo conectar con el servidor.");
      }
    },
    [pollOperation]
  );

  const busy = status === "uploading" || status === "processing";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 md:py-16">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.24em] text-red">
            De Audio a Texto 
          </p>
          <h1 className="font-display text-4xl font-bold italic tracking-tight text-text md:text-5xl">
            Cinta
          </h1>
          <p className="max-w-md font-body text-sm leading-relaxed text-muted">
            Graba o sube un audio y obtén su transcripción en español, sin pasos de más.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <OnAirSign active={isRecording} />
          <ThemeToggle />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-5">
          <div className="rounded-[3px] border border-line bg-panel p-6">
            <p className="mb-5 text-center font-label text-[12px] font-semibold uppercase tracking-[0.18em] text-faint">
              Grabar
            </p>
            <Recorder
              disabled={busy}
              onRecordingChange={setIsRecording}
              onComplete={(blob) => sendAudio(blob, "grabacion.webm")}
            />
          </div>

          <div className="rounded-[3px] border border-line bg-panel p-2">
            <Uploader disabled={busy} onFile={(file) => sendAudio(file, file.name)} />
          </div>

          {fileName && (
            <p className="truncate px-1 font-mono text-[11px] text-faint">
              Última fuente: {fileName}
            </p>
          )}

          <HistoryList
            entries={history}
            onSelect={(entry) => {
              setStatus("done");
              setTranscript(entry.transcript);
              setFileName(entry.label);
            }}
          />
        </div>

        <TranscriptView status={status} transcript={transcript} errorMessage={errorMessage} />
      </div>

      <footer className="mt-10 flex items-center justify-between border-t border-line pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          Transcripción automática · Español
        </p>
        <p className="font-mono text-[10px] text-faint">v2.0</p>
      </footer>
    </main>
  );
}
