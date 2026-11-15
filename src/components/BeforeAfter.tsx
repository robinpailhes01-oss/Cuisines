"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  before: string;
  after: string;
  /** Ratio largeur/hauteur affiché (celui de la photo client). */
  ratio: number;
  /** Animation d'introduction (balayage). */
  intro?: boolean;
  labels?: [string, string];
  className?: string;
}

export function BeforeAfter({ before, after, ratio, intro = false, labels = ["Avant", "Après"], className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(intro ? 100 : 50);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!intro) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1800);
      const e = 1 - Math.pow(1 - k, 3);
      setPos(100 - e * 50);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => (raf = requestAnimationFrame(tick)), 300);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [intro, after]);

  const move = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  return (
    <div
      ref={ref}
      className={`relative w-full select-none overflow-hidden rounded-2xl bg-sand touch-pan-y ${dragging ? "cursor-grabbing" : "cursor-ew-resize"} ${className}`}
      style={{ aspectRatio: ratio }}
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setDragging(true);
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging && move(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Après : la cuisine choisie dans votre pièce" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Avant : votre pièce actuelle" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-night/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cream backdrop-blur" style={{ opacity: pos > 12 ? 1 : 0 }}>
        {labels[0]}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-cream/85 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink backdrop-blur" style={{ opacity: pos < 88 ? 1 : 0 }}>
        {labels[1]}
      </span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,.35)]" style={{ left: `${pos}%`, transform: "translateX(-50%)" }} />
      <button
        type="button"
        role="slider"
        aria-label="Comparer avant et après"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
        }}
        className="absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-lg ring-1 ring-black/5"
        style={{ left: `${pos}%` }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
