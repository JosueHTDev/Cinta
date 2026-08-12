"use client";

const MIN_DEG = -55;
const MAX_DEG = 55;

export default function VuMeter({ level, active }: { level: number; active: boolean }) {
  const clamped = Math.max(0, Math.min(1, level));
  const angle = active ? MIN_DEG + clamped * (MAX_DEG - MIN_DEG) : MIN_DEG;
  const inRed = clamped > 0.86;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[210px]" aria-hidden="true">
        <path
          d="M 16 108 A 84 84 0 0 1 184 108"
          fill="none"
          stroke="var(--line)"
          strokeWidth="3"
        />
        <path
          d="M 148 44 A 84 84 0 0 1 184 108"
          fill="none"
          stroke="var(--red)"
          strokeWidth="3"
          opacity={active ? 1 : 0.35}
        />
        {Array.from({ length: 9 }).map((_, i) => {
          const t = i / 8;
          const deg = MIN_DEG + t * (MAX_DEG - MIN_DEG);
          const rad = (deg * Math.PI) / 180;
          const x1 = 100 + Math.sin(rad) * 78;
          const y1 = 108 - Math.cos(rad) * 78;
          const x2 = 100 + Math.sin(rad) * 86;
          const y2 = 108 - Math.cos(rad) * 86;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={t > 0.78 ? "var(--red)" : "var(--faint)"}
              strokeWidth="2"
            />
          );
        })}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "100px 108px",
            transition: "transform 90ms linear",
          }}
        >
          <line
            x1="100"
            y1="108"
            x2="100"
            y2="30"
            stroke={inRed ? "var(--red-bright)" : "var(--gold)"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <circle cx="100" cy="108" r="5" fill="var(--faint)" />
      </svg>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Nivel de entrada</p>
    </div>
  );
}
