"use client";

import { useMemo, useState } from "react";
import assets from "@/data/catalogue-assets.json";
import { CATALOGUE, type KitchenModel } from "@/data/catalogue";
import type { RenderOptions } from "@/lib/prompt";
import type { PreparedPhoto } from "@/lib/photo";

const FILTERS = ["Tous", "Réalisation BP", "Sélection Arrex", "Clair", "Sombre", "Bois", "Couleur", "Îlot"] as const;
type Assets = Record<string, { hero: string; thumb: string; gallery: { src: string }[] }>;
const A = assets as Assets;

export function StepModel({
  photo,
  model,
  options,
  onModel,
  onOptions,
  onBack,
  onRender,
  resolution,
}: {
  photo: PreparedPhoto;
  model: KitchenModel;
  options: RenderOptions;
  onModel: (m: KitchenModel) => void;
  onOptions: (o: RenderOptions) => void;
  onBack: () => void;
  onRender: () => void;
  resolution: string;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const list = useMemo(
    () => CATALOGUE.filter((m) => filter === "Tous" || m.collection === filter || m.tags.includes(filter)),
    [filter],
  );
  const set = <K extends keyof RenderOptions>(k: K, v: RenderOptions[K]) => onOptions({ ...options, [k]: v });

  return (
    <>
    <section className="fade-up grid grid-cols-1 gap-8 pt-8 pb-20 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 lg:pb-0">
      <div>
        <p className="eyebrow">Étape 2 · Votre cuisine</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">Choisissez un modèle.</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Chaque modèle est une cuisine réellement conçue et posée par BP Cuisines, ou sélectionnée dans la gamme Arrex disponible au showroom de Cernier.
        </p>

        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="toolbar" aria-label="Filtrer les modèles">
          {FILTERS.map((f) => (
            <button key={f} type="button" className="chip shrink-0" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => {
            const selected = m.id === model.id;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onModel(m)}
                  aria-pressed={selected}
                  className={`group block w-full overflow-hidden rounded-2xl bg-white text-left ring-1 transition duration-300 ${selected ? "ring-2 ring-ink shadow-xl" : "ring-line hover:-translate-y-0.5 hover:shadow-lg"}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={A[m.id].thumb} alt={`Cuisine ${m.name}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[.68rem] font-bold uppercase tracking-widest backdrop-blur">{m.collection}</span>
                    {selected && <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-ink text-cream">✓</span>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-xl leading-tight">{m.name}</h3>
                      <span className="mt-1 flex shrink-0 -space-x-1.5">
                        {m.swatches.map((s) => (
                          <span key={s.hex} title={s.label} className="size-5 rounded-full ring-2 ring-white" style={{ background: s.hex }} />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{m.tagline}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="Votre pièce" className="h-16 w-24 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="eyebrow">Votre pièce</p>
              <button type="button" onClick={onBack} className="text-sm underline underline-offset-4">Changer de photo</button>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="eyebrow">Modèle choisi</p>
            <p className="mt-1 font-serif text-2xl">{model.name}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-ink-soft">Façades</dt><dd>{model.materials.facades}</dd>
              <dt className="text-ink-soft">Plan</dt><dd>{model.materials.plan}</dd>
              <dt className="text-ink-soft">Crédence</dt><dd>{model.materials.credence}</dd>
            </dl>
          </div>

          <div className="mt-5 space-y-4 border-t border-line pt-5">
            <Option label="Implantation">
              <div className="seg">
                {([
                  ["auto", "Comme l’existant"],
                  ["linear", "Linéaire"],
                  ["l-shape", "En L"],
                  ["island", "Avec îlot"],
                ] as const).map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={options.layout === v} onClick={() => set("layout", v)}>{l}</button>
                ))}
              </div>
            </Option>
            <Option label="Ambiance">
              <div className="seg">
                <button type="button" aria-pressed={options.ambiance === "daylight"} onClick={() => set("ambiance", "daylight")}>Lumière du jour</button>
                <button type="button" aria-pressed={options.ambiance === "evening"} onClick={() => set("ambiance", "evening")}>Soirée, LED</button>
              </div>
            </Option>
            <Option label="Sol">
              <div className="seg">
                <button type="button" aria-pressed={options.floor === "keep"} onClick={() => set("floor", "keep")}>Conserver</button>
                <button type="button" aria-pressed={options.floor === "refresh"} onClick={() => set("floor", "refresh")}>Rafraîchir</button>
              </div>
            </Option>
            <label className="flex cursor-pointer items-center justify-between gap-4 text-sm">
              <span>Ranger les objets du quotidien</span>
              <input type="checkbox" className="size-5 accent-[#332e2a]" checked={options.declutter} onChange={(e) => set("declutter", e.target.checked)} />
            </label>
          </div>

          <button type="button" className="btn btn-dark mt-6 w-full !py-4" onClick={onRender}>
            Générer le rendu {resolution}
          </button>
          <p className="mt-3 text-center text-xs text-ink-soft">Environ 30 à 60 secondes · gratuit et sans engagement</p>
        </div>
      </aside>
    </section>

      {/* Barre d’action mobile (hors section animée : un ancêtre transformé casserait position:fixed) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 p-3 backdrop-blur lg:hidden">
        <button type="button" className="btn btn-dark w-full !py-4" onClick={onRender}>
          Générer · {model.name}
        </button>
      </div>
    </>
  );
}

function Option({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">{label}</p>
      {children}
    </div>
  );
}
