"use client";

export type Step = "photo" | "model" | "render";

const STEPS: { id: Step; label: string }[] = [
  { id: "photo", label: "Votre pièce" },
  { id: "model", label: "Votre cuisine" },
  { id: "render", label: "Le rendu" },
];

export function Header({
  step,
  canGo,
  onStep,
  demo,
}: {
  step: Step;
  canGo: Record<Step, boolean>;
  onStep: (s: Step) => void;
  demo?: boolean;
}) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-10">
        <a href="https://www.bpcuisines.ch" className="flex shrink-0 items-center gap-3" aria-label="BP Cuisines — site principal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-bpc-dark.png" alt="BP Cuisines" className="h-7 w-auto sm:h-8" />
          <span className="hidden border-l border-line pl-3 font-serif text-lg leading-none sm:block">Visualiseur</span>
        </a>
        <nav aria-label="Étapes" className="mx-auto flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            const done = i < idx;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!canGo[s.id]}
                onClick={() => onStep(s.id)}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full px-2 py-1.5 text-sm transition sm:px-3 ${active ? "bg-ink text-cream" : "text-ink-soft enabled:hover:text-ink disabled:opacity-40"}`}
              >
                <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${active ? "bg-cream text-ink" : done ? "bg-ink text-cream" : "border border-line bg-white"}`}>
                  {done ? "✓" : i + 1}
                </span>
                <span className={active ? "inline" : "hidden md:inline"}>{s.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {demo && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">Mode démo</span>}
          <a href="https://www.bpcuisines.ch/estimation" className="btn btn-light !py-2.5 !text-[.7rem]">Estimation</a>
        </div>
      </div>
    </header>
  );
}
