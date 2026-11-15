"use client";

import { useEffect, useRef, useState } from "react";

/** Visionneuse plein écran : ajusté ↔ 100 % (pixels réels), déplacement au doigt, bascule avant/après. */
export function Viewer({ src, before, title, onClose }: { src: string; before: string; title: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setShowBefore((b) => !b);
      }
    };
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Rendu ${title}`} className="fixed inset-0 z-50 flex flex-col bg-night text-cream">
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <p className="mr-auto truncate font-serif text-lg">{title}</p>
        <button type="button" className="rounded-full bg-cream/10 px-4 py-2 text-sm hover:bg-cream/20" onPointerDown={() => setShowBefore(true)} onPointerUp={() => setShowBefore(false)} onPointerLeave={() => setShowBefore(false)}>
          Maintenir : avant
        </button>
        <button type="button" className="rounded-full bg-cream/10 px-4 py-2 text-sm hover:bg-cream/20" onClick={() => setZoom((z) => !z)}>
          {zoom ? "Ajuster" : "Zoom 100 %"}
        </button>
        <button type="button" aria-label="Fermer" className="grid size-10 place-items-center rounded-full bg-cream text-ink" onClick={onClose}>✕</button>
      </div>
      <div ref={box} className={`relative flex-1 ${zoom ? "overflow-auto" : "overflow-hidden"}`} onDoubleClick={() => setZoom((z) => !z)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showBefore ? before : src}
          alt={showBefore ? "Avant" : "Après"}
          className={zoom ? "max-w-none" : "absolute inset-0 h-full w-full object-contain p-2"}
          style={zoom ? { width: "auto", height: "auto" } : undefined}
          draggable={false}
        />
      </div>
      <p className="p-3 text-center text-xs text-cream/60">Double-clic pour zoomer · Espace pour comparer · Échap pour fermer</p>
    </div>
  );
}
