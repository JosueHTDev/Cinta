"use client";

import { useEffect, useRef, useState } from "react";
import VuMeter from "./VuMeter";

function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return "";
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Recorder({
  disabled,
  onRecordingChange,
  onComplete,
}: {
  disabled: boolean;
  onRecordingChange?: (recording: boolean) => void;
  onComplete: (blob: Blob) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");

  const tickLevel = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    setLevel(Math.min(1, rms * 3.2));
    rafRef.current = requestAnimationFrame(tickLevel);
  };

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(tickLevel);

      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        stopAll();
        setElapsed(0);
        onComplete(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      onRecordingChange?.(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err) {
      setError("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    onRecordingChange?.(false);
  };

  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <VuMeter level={level} active={recording} />

      <button
        type="button"
        disabled={disabled}
        onClick={recording ? stop : start}
        aria-pressed={recording}
        aria-label={recording ? "Detener grabación" : "Iniciar grabación"}
        className="group flex w-full max-w-[210px] items-center justify-between rounded-[3px] border border-line bg-panel2 px-4 py-3 transition-colors hover:border-red disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="font-label text-[13px] font-semibold uppercase tracking-[0.14em] text-text">
          {recording ? "Detener" : "Grabar"}
        </span>
        <span
          className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-all ${
            recording
              ? "border-redBright bg-redBright shadow-[0_0_10px_rgba(232,73,46,0.6)]"
              : "border-red bg-transparent group-hover:bg-red/20"
          }`}
        />
      </button>

      <div className="font-mono text-sm text-muted tabular-nums">
        {recording ? formatTime(elapsed) : "00:00"}
      </div>

      {error && <p className="max-w-[220px] text-center text-xs text-red">{error}</p>}
    </div>
  );
}
