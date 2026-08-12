"use client";

import { useRef, useState } from "react";

const ACCEPTED = [".wav", ".mp3", ".flac", ".ogg", ".webm"];

export default function Uploader({
  disabled,
  onFile,
}: {
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFile(files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center gap-3 rounded-[3px] border border-dashed px-4 py-6 text-center transition-colors
        ${dragOver ? "border-red bg-red/5" : "border-line"}
        ${disabled ? "opacity-40" : ""}`}
    >
      <p className="font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-faint">
        Cargar cinta
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="rounded-[3px] border border-line bg-panel2 px-4 py-2 text-sm font-medium text-text hover:border-red disabled:cursor-not-allowed"
      >
        Elegir archivo
      </button>
      <p className="text-[11px] text-faint">o arrástralo aquí</p>
      <p className="font-mono text-[10px] tracking-wide text-faint">
        {ACCEPTED.join("  ·  ").toUpperCase()}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
