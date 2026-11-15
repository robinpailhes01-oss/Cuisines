"use client";

import { useRef, useState } from "react";
import { preparePhoto, type PreparedPhoto } from "@/lib/photo";
import { BeforeAfter } from "./BeforeAfter";

const TIPS = [
  { t: "À l’horizontale", d: "Tenez le téléphone en paysage pour cadrer tout le mur de la cuisine." },
  { t: "Depuis l’angle opposé", d: "Reculez au maximum, à hauteur de poitrine, objectif bien droit." },
  { t: "En pleine lumière", d: "Lumière du jour et plafonnier allumé : les matières seront plus justes." },
  { t: "Pièce vide ou existante", d: "Une ancienne cuisine ou un mur nu : l’IA remplace tout le mobilier." },
];

export function StepPhoto({ photo, onPhoto, onNext }: { photo: PreparedPhoto | null; onPhoto: (p: PreparedPhoto) => void; onNext: () => void }) {
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  async function handle(file?: Blob | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onPhoto(await preparePhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo illisible");
    } finally {
      setBusy(false);
    }
  }

  async function useExample() {
    const blob = await fetch("/demo/avant.jpg").then((r) => r.blob());
    await handle(blob);
  }

  if (photo) {
    return (
      <section className="fade-up mx-auto max-w-5xl pt-8 sm:pt-12">
        <p className="eyebrow">Étape 1 · Votre pièce</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">Photo prête.</h1>
        <div className="mt-6 overflow-hidden rounded-2xl bg-sand ring-1 ring-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="Votre pièce" className="max-h-[62vh] w-full object-contain" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
          <span>✓ {photo.originalWidth} × {photo.originalHeight} px</span>
          <span>✓ Orientation corrigée</span>
          <span>✓ Optimisée pour l’envoi ({Math.round(photo.blob.size / 1024)} Ko)</span>
        </div>
        {photo.warnings.length > 0 && (
          <ul className="mt-4 space-y-2">
            {photo.warnings.map((w) => (
              <li key={w} className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">{w}</li>
            ))}
          </ul>
        )}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className="btn btn-light" onClick={() => camRef.current?.click()}>Reprendre une photo</button>
          <button type="button" className="btn btn-dark" onClick={onNext}>Choisir ma cuisine →</button>
        </div>
        <Inputs camRef={camRef} fileRef={fileRef} onFile={handle} />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 items-center gap-10 pt-8 sm:pt-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:pt-20">
      <div className="fade-up">
        <p className="eyebrow">Visualiseur BP Cuisines</p>
        <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
          Votre future cuisine, <em className="italic">dans votre pièce.</em>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
          Prenez votre cuisine en photo, choisissez l’une de nos réalisations et découvrez en moins d’une minute à quoi elle ressemblerait chez vous, en haute définition.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            handle(e.dataTransfer.files?.[0]);
          }}
          className={`mt-8 rounded-3xl border-2 border-dashed p-5 transition sm:p-6 ${over ? "border-ink bg-white" : "border-line bg-white/60"}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={busy} className="btn btn-dark flex-1" onClick={() => camRef.current?.click()}>
              <CameraIcon /> Prendre une photo
            </button>
            <button type="button" disabled={busy} className="btn btn-light flex-1" onClick={() => fileRef.current?.click()}>
              Importer une photo
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-ink-soft">
            {busy ? "Préparation de la photo…" : <>ou glissez une image ici · <button type="button" className="font-bold text-ink underline underline-offset-4" onClick={useExample}>essayer avec notre photo d’exemple</button></>}
          </p>
        </div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}
        <p className="mt-4 text-xs text-ink-soft">Vos photos servent uniquement à générer le rendu. Elles ne sont ni publiées ni revendues.</p>
      </div>

      <div className="fade-up [animation-delay:150ms]">
        <BeforeAfter before="/demo/avant.jpg" after="/demo/apres-graphite-chaleureux.jpg" ratio={4 / 3} intro />
        <p className="mt-3 text-sm text-ink-soft">
          Exemple réel : photo prise au téléphone → modèle <b className="text-ink">Graphite chaleureux</b>. Glissez pour comparer.
        </p>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
        {TIPS.map((tip, i) => (
          <li key={tip.t} className="bg-cream p-5 sm:p-6">
            <span className="font-serif text-3xl text-ink-soft/60">0{i + 1}</span>
            <h3 className="mt-2 text-base font-bold">{tip.t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{tip.d}</p>
          </li>
        ))}
      </ol>
      <Inputs camRef={camRef} fileRef={fileRef} onFile={handle} />
    </section>
  );
}

function Inputs({ camRef, fileRef, onFile }: { camRef: React.RefObject<HTMLInputElement | null>; fileRef: React.RefObject<HTMLInputElement | null>; onFile: (f?: File) => void }) {
  return (
    <>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
    </>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
