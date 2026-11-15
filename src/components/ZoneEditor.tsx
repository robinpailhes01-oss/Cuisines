"use client";

import { useEffect, useRef, useState } from "react";
import type { PreparedPhoto } from "@/lib/photo";

/** Largeur interne du masque : suffisant pour un tracé au doigt, léger à envoyer. */
const MASK_W = 1024;

export interface Zone {
  canvas: HTMLCanvasElement;
  /** Part de la photo couverte (0..1). */
  coverage: number;
  version: number;
}

/**
 * Le client peint la zone où la cuisine doit être installée.
 * Hors de cette zone, la photo d'origine est conservée au pixel près.
 */
export function ZoneEditor({ photo, zone, onChange }: { photo: PreparedPhoto; zone: Zone | null; onChange: (z: Zone | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [size, setSize] = useState(7); // % de la largeur
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const versionRef = useRef(zone?.version ?? 0);
  const H = Math.round((MASK_W * photo.height) / photo.width);

  // Restaure une zone existante (retour depuis l'étape suivante).
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    if (zone) ctx.drawImage(zone.canvas, 0, 0, c.width, c.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.url]);

  function point(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * MASK_W, y: ((e.clientY - r.top) / r.height) * H };
  }

  function stroke(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = ref.current!.getContext("2d")!;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = "#e8231e";
    ctx.fillStyle = "#e8231e";
    ctx.lineWidth = (size / 100) * MASK_W;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x + 0.01, to.y);
    ctx.stroke();
  }

  function commit() {
    const c = ref.current!;
    const px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < px.length; i += 16) if (px[i] > 0) n++;
    const coverage = n / (px.length / 16);
    if (coverage < 0.005) return onChange(null);
    // Copie figée : un rendu déjà lancé garde la zone qu'il a reçue.
    const copy = document.createElement("canvas");
    copy.width = c.width;
    copy.height = c.height;
    copy.getContext("2d")!.drawImage(c, 0, 0);
    onChange({ canvas: copy, coverage, version: ++versionRef.current });
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-sand ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt="Votre pièce" className="block w-full select-none" draggable={false} />
        <canvas
          ref={ref}
          width={MASK_W}
          height={H}
          aria-label="Zone à transformer : peignez au doigt l’emplacement de la cuisine"
          className={`absolute inset-0 h-full w-full touch-none opacity-50 ${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            const p = point(e);
            drawing.current = p;
            stroke(p, p);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const p = point(e);
            stroke(drawing.current, p);
            drawing.current = p;
          }}
          onPointerUp={() => {
            drawing.current = null;
            commit();
          }}
          onPointerCancel={() => {
            drawing.current = null;
            commit();
          }}
        />
        {!zone && (
          <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl bg-night/75 px-4 py-2.5 text-center text-sm text-cream backdrop-blur">
            Peignez toute l’ancienne cuisine, du plafond au sol (et le sol pour un îlot)
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="seg !inline-grid">
          <button type="button" aria-pressed={tool === "brush"} onClick={() => setTool("brush")} className="!px-4">Pinceau</button>
          <button type="button" aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")} className="!px-4">Gomme</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Taille
          <input type="range" min={2} max={16} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-28 accent-[#332e2a]" />
        </label>
        <button
          type="button"
          className="btn btn-ghost !text-[.7rem]"
          onClick={() => {
            const c = ref.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            onChange(null);
          }}
        >
          Tout effacer
        </button>
        <span className="ml-auto text-sm text-ink-soft">{zone ? `Zone : ${Math.round(zone.coverage * 100)} % de la photo` : "Aucune zone : l’IA choisit"}</span>
      </div>
    </div>
  );
}

/** Masque blanc sur noir (PNG) pour l'API. */
export async function zoneToPng(zone: Zone): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = zone.canvas.width;
  c.height = zone.canvas.height;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  // Les tracés rouges deviennent blancs.
  const tmp = document.createElement("canvas");
  tmp.width = c.width;
  tmp.height = c.height;
  const t = tmp.getContext("2d")!;
  t.drawImage(zone.canvas, 0, 0);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = "#fff";
  t.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(tmp, 0, 0);
  return new Promise((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("Masque illisible"))), "image/png"));
}
