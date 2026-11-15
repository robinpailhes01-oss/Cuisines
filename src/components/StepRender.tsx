"use client";

import { useEffect, useRef, useState } from "react";
import type { KitchenModel } from "@/data/catalogue";
import type { RenderOptions } from "@/lib/prompt";
import type { PreparedPhoto } from "@/lib/photo";
import { finalizeRender } from "@/lib/composite";
import { zoneToPng, type Zone } from "./ZoneEditor";
import { BeforeAfter } from "./BeforeAfter";
import { LeadForm } from "./LeadForm";
import { Viewer } from "./Viewer";
import type { EngineStatus } from "./Visualiseur";

export interface RenderResult {
  id: string;
  model: KitchenModel;
  options: RenderOptions;
  zone: Zone | null;
  status: "pending" | "done" | "error";
  phase: "rendering" | "checking" | "retrying";
  attempt: number;
  startedAt: number;
  /** Image brute renvoyée par l'IA (URL hébergée, transmise avec la demande d'estimation). */
  aiUrl?: string;
  qc?: { aligned: boolean; spill: number; restored: boolean; attempts: number };
  jobId?: string | null;
  imageUrl?: string;
  width?: number;
  height?: number;
  error?: string;
  demo?: boolean;
  resolution?: string;
}

const STAGES = [
  { at: 0, label: "Analyse de la pièce et de la perspective" },
  { at: 12, label: "Dépose de l’ancienne cuisine" },
  { at: 30, label: "Pose des meubles et du plan de travail" },
  { at: 55, label: "Matières, reflets et lumière" },
  { at: 80, label: "Finition haute définition" },
];
const EXPECTED_MS = 90_000; // rendu 4K mesuré : ~90 s

export function StepRender({
  photo,
  renders,
  currentId,
  onSelect,
  onUpdate,
  onTryAnother,
  onNewPhoto,
  engine,
}: {
  photo: PreparedPhoto;
  renders: RenderResult[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<RenderResult>) => void;
  onTryAnother: () => void;
  onNewPhoto: () => void;
  engine: EngineStatus | null;
}) {
  const startedRef = useRef(new Set<string>());
  const current = renders.find((r) => r.id === currentId) ?? renders[0];
  const [viewer, setViewer] = useState(false);
  const ratio = photo.width / photo.height;

  // Lance et suit chaque rendu une seule fois.
  useEffect(() => {
    for (const r of renders) {
      if (r.status !== "pending" || startedRef.current.has(r.id)) continue;
      startedRef.current.add(r.id);
      run(r, photo, onUpdate);
    }
  }, [renders, photo, onUpdate]);

  if (!current) return null;

  return (
    <section className="fade-up grid grid-cols-1 gap-8 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <div className="min-w-0">
        <p className="eyebrow">Étape 3 · Le rendu</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">
          {current.status === "done" ? <>Votre pièce, en <em>{current.model.name}</em>.</> : current.status === "error" ? "Le rendu n’a pas abouti." : <>Installation de <em>{current.model.name}</em>…</>}
        </h1>

        <div className="mt-6">
          {current.status === "done" && current.imageUrl ? (
            <div className="relative">
              <BeforeAfter key={current.id} before={photo.url} after={current.imageUrl} ratio={ratio} intro />
              {current.demo && !["graphite-chaleureux", "cuisine-verte"].includes(current.model.id) && (
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  Démo : rendu d’exemple « Graphite chaleureux »
                </span>
              )}
            </div>
          ) : current.status === "error" ? (
            <div className="grid place-items-center rounded-2xl bg-sand p-10 text-center ring-1 ring-line" style={{ aspectRatio: ratio }}>
              <div>
                <p className="text-ink-soft">{current.error}</p>
                <button type="button" className="btn btn-dark mt-5" onClick={() => { startedRef.current.delete(current.id); onUpdate(current.id, { status: "pending", phase: "rendering", attempt: 1, error: undefined, startedAt: Date.now() }); }}>
                  Relancer le rendu
                </button>
              </div>
            </div>
          ) : (
            <Pending photo={photo} startedAt={current.startedAt} ratio={ratio} phase={current.phase} />
          )}
        </div>

        {current.status === "done" && current.imageUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-light !py-3" onClick={() => setViewer(true)}>Voir en plein écran</button>
            <button type="button" className="btn btn-light !py-3" onClick={() => download(current)}>Télécharger</button>
            <ShareButton r={current} />
            <span className="ml-auto text-xs text-ink-soft">
              {current.width ? `${current.width} × ${current.height} px` : current.resolution}
              {current.demo && " · rendu de démonstration"}
            </span>
          </div>
        )}
        {current.status === "done" && current.qc && <QualityBadge qc={current.qc} zone={!!current.zone} />}

        {renders.length > 1 && (
          <div className="mt-8">
            <p className="eyebrow">Vos essais</p>
            <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {renders.map((r) => (
                <li key={r.id} className="shrink-0">
                  <button type="button" onClick={() => onSelect(r.id)} aria-pressed={r.id === current.id} className={`block w-40 overflow-hidden rounded-xl bg-white text-left ring-1 transition ${r.id === current.id ? "ring-2 ring-ink" : "ring-line"}`}>
                    <div className="relative aspect-[4/3] bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.imageUrl ?? photo.url} alt="" className={`h-full w-full object-cover ${r.status !== "done" ? "opacity-50 blur-[1px]" : ""}`} />
                      {r.status === "pending" && <span className="absolute inset-0 grid place-items-center text-xs font-bold">En cours…</span>}
                    </div>
                    <p className="truncate px-3 py-2 text-sm">{r.model.name}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
          <p className="eyebrow">{current.model.collection}</p>
          <p className="mt-1 font-serif text-2xl">{current.model.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{current.model.description}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button type="button" className="btn btn-dark flex-1" onClick={onTryAnother}>Essayer un autre modèle</button>
            <button type="button" className="btn btn-light flex-1" onClick={onNewPhoto}>Nouvelle photo</button>
          </div>
          <a href={current.model.url} target="_blank" rel="noreferrer" className="mt-3 block text-center text-sm underline underline-offset-4">Voir la réalisation sur bpcuisines.ch ↗</a>
        </div>
        <LeadForm render={current} />
        {engine?.demo && (
          <p className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            Mode démonstration : aucune clé IA n’est configurée, un rendu d’exemple est affiché. Ajoutez une clé (KIE_API_KEY, FAL_KEY ou GEMINI_API_KEY) pour générer de vrais rendus de vos photos.
          </p>
        )}
      </aside>

      {viewer && current.imageUrl && <Viewer src={current.imageUrl} before={photo.url} title={current.model.name} onClose={() => setViewer(false)} />}
    </section>
  );
}

const MAX_ATTEMPTS = 2;

async function renderOnce(r: RenderResult, photo: PreparedPhoto, onUpdate: (id: string, p: Partial<RenderResult>) => void) {
  const fd = new FormData();
  fd.append("photo", photo.blob, "piece.jpg");
  fd.append("modelId", r.model.id);
  fd.append("options", JSON.stringify(r.options));
  if (r.zone) fd.append("mask", await zoneToPng(r.zone), "zone.png");
  const res = await fetch("/api/render", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Le service de rendu ne répond pas.");
  onUpdate(r.id, { demo: data.demo, resolution: data.resolution, jobId: data.jobId });
  if (data.status === "done") return { url: data.imageUrl as string, demo: !!data.demo };
  const deadline = Date.now() + 6 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((ok) => setTimeout(ok, 2500));
    const st = await fetch(`/api/render/${encodeURIComponent(data.jobId)}`, { cache: "no-store" }).then((x) => x.json());
    if (st.status === "done") return { url: st.imageUrl as string, demo: !!data.demo };
    if (st.status === "error") throw new Error(st.message);
  }
  throw new Error("Le rendu prend plus de temps que prévu. Merci de réessayer.");
}

/**
 * Rendu + contrôle qualité. Si la perspective a bougé ou si l'IA a débordé
 * hors de la zone, un second essai est lancé automatiquement ; on garde le meilleur.
 */
async function run(r: RenderResult, photo: PreparedPhoto, onUpdate: (id: string, p: Partial<RenderResult>) => void) {
  try {
    let best: { url: string; aiUrl: string; width: number; height: number; ok: boolean; restored: boolean; aligned: boolean; spill: number; score: number } | null = null;
    let attempts = 0;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      attempts = attempt;
      onUpdate(r.id, { phase: attempt === 1 ? "rendering" : "retrying", attempt });
      const { url, demo } = await renderOnce(r, photo, onUpdate);
      onUpdate(r.id, { phase: "checking" });
      let q;
      try {
        q = await finalizeRender(url, photo, r.zone?.canvas ?? null);
      } catch {
        q = null; // contrôle impossible (navigateur ancien) : on garde le rendu tel quel
      }
      const score = q ? (q.ok ? 2 : 0) + q.report.similarity - q.report.spill : 0;
      const cand = {
        url: q?.url ?? url, aiUrl: url, width: q?.width ?? 0, height: q?.height ?? 0,
        ok: q?.ok ?? true, restored: q?.restored ?? false, aligned: q?.report.aligned ?? true, spill: q?.report.spill ?? 0, score,
      };
      if (!best || cand.score > best.score) best = cand;
      if (cand.ok || demo) break;
    }
    const b = best!;
    onUpdate(r.id, { aiUrl: b.aiUrl, qc: { aligned: b.aligned, spill: b.spill, restored: b.restored, attempts } });
    finish(r.id, b.url, onUpdate);
  } catch (e) {
    onUpdate(r.id, { status: "error", error: e instanceof Error ? e.message : "Erreur inattendue" });
  }
}

/** Précharge l’image (évite un affichage progressif) puis lit sa taille réelle. */
function finish(id: string, url: string, onUpdate: (id: string, p: Partial<RenderResult>) => void) {
  const img = new Image();
  img.onload = () => onUpdate(id, { status: "done", imageUrl: url, width: img.naturalWidth, height: img.naturalHeight });
  img.onerror = () => onUpdate(id, { status: "error", error: "Image du rendu inaccessible." });
  img.src = url;
}

function QualityBadge({ qc, zone }: { qc: NonNullable<RenderResult["qc"]>; zone: boolean }) {
  const items: { ok: boolean; text: string }[] = [
    { ok: qc.aligned, text: qc.aligned ? "Perspective de la pièce conservée" : "Perspective légèrement modifiée par l’IA" },
  ];
  if (zone) {
    items.push(
      qc.restored
        ? { ok: true, text: "Hors de la zone : votre photo d’origine, au pixel près" }
        : { ok: false, text: "L’IA a débordé de la zone : rendu affiché sans restauration" },
    );
  } else {
    items.push({ ok: false, text: "Astuce : peignez la zone de la cuisine pour figer le reste de la pièce" });
  }
  if (qc.attempts > 1) items.push({ ok: true, text: "Contrôle qualité : un 2ᵉ essai a été fait automatiquement" });
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Contrôle qualité">
      {items.map((i) => (
        <li key={i.text} className={`rounded-full px-3 py-1.5 text-xs font-bold ${i.ok ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"}`}>
          {i.ok ? "✓" : "!"} {i.text}
        </li>
      ))}
    </ul>
  );
}

const PHASE_LABEL = {
  checking: "Contrôle qualité : perspective et zone protégée",
  retrying: "La perspective a bougé : nouvel essai automatique",
} as const;

function Pending({ photo, startedAt, ratio, phase }: { photo: PreparedPhoto; startedAt: number; ratio: number; phase: RenderResult["phase"] }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const elapsed = now - startedAt;
  // Progression asymptotique : avance vite puis ralentit sans jamais mentir à 100 %.
  const pct = Math.min(96, 100 * (1 - Math.exp(-elapsed / (EXPECTED_MS * 0.6))));
  const stage = [...STAGES].reverse().find((s) => pct >= s.at) ?? STAGES[0];
  return (
    <div className="relative overflow-hidden rounded-2xl bg-sand" style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 saturate-50" />
      <div className="scan absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 via-night/50 to-transparent p-5 pt-16 text-cream sm:p-8">
        <p className="font-serif text-xl sm:text-2xl" aria-live="polite">{phase === "rendering" ? stage.label : PHASE_LABEL[phase]}…</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-cream/25">
          <div className="h-full rounded-full bg-cream transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-4 hidden gap-4 text-xs text-cream/70 sm:flex">
          {STAGES.map((s) => (
            <li key={s.label} className={pct >= s.at ? "text-cream" : ""}>{pct >= s.at ? "●" : "○"} {s.label.split(" ")[0]}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-cream/70">{Math.floor(elapsed / 1000)} s · vous pouvez déjà choisir un autre modèle, les rendus s’enchaînent.</p>
      </div>
    </div>
  );
}

async function download(r: RenderResult) {
  const name = `bp-cuisines-${r.model.id}-${r.resolution ?? ""}.jpg`.replace(/-\./, ".");
  try {
    const blob = await fetch(r.imageUrl!).then((x) => x.blob());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch {
    window.open(r.imageUrl, "_blank");
  }
}

function ShareButton({ r }: { r: RenderResult }) {
  const [can, setCan] = useState(false);
  useEffect(() => setCan(typeof navigator !== "undefined" && "share" in navigator), []);
  if (!can) return null;
  return (
    <button
      type="button"
      className="btn btn-light !py-3"
      onClick={async () => {
        try {
          const blob = await fetch(r.imageUrl!).then((x) => x.blob());
          const file = new File([blob], `ma-cuisine-${r.model.id}.jpg`, { type: "image/jpeg" });
          const data: ShareData = { title: `Ma cuisine ${r.model.name} — BP Cuisines`, text: "Voici à quoi pourrait ressembler notre cuisine :", files: [file] };
          if (navigator.canShare?.(data)) await navigator.share(data);
          else await navigator.share({ title: data.title, text: data.text, url: location.href });
        } catch {
          /* partage annulé */
        }
      }}
    >
      Partager
    </button>
  );
}
