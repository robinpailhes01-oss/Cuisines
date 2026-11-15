"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATALOGUE, type KitchenModel } from "@/data/catalogue";
import { DEFAULT_OPTIONS, type RenderOptions } from "@/lib/prompt";
import type { PreparedPhoto } from "@/lib/photo";
import { Header, type Step } from "./Header";
import { StepPhoto } from "./StepPhoto";
import { StepModel } from "./StepModel";
import { StepRender, type RenderResult } from "./StepRender";

export interface EngineStatus {
  provider: string;
  label: string;
  demo: boolean;
  resolution: string;
}

export function Visualiseur() {
  const [step, setStep] = useState<Step>("photo");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [model, setModel] = useState<KitchenModel>(CATALOGUE.find((m) => m.id === "graphite-chaleureux")!);
  const [options, setOptions] = useState<RenderOptions>(DEFAULT_OPTIONS);
  const [renders, setRenders] = useState<RenderResult[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineStatus | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setEngine).catch(() => null);
  }, []);

  const go = useCallback((s: Step) => {
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const startRender = useCallback(() => {
    if (!photo) return;
    const id = `${Date.now()}`;
    setRenders((r) => [{ id, model, options, status: "pending", startedAt: Date.now() }, ...r]);
    setCurrent(id);
    go("render");
  }, [photo, model, options, go]);

  const updateRender = useCallback((id: string, patch: Partial<RenderResult>) => {
    setRenders((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  return (
    <div ref={topRef} className="min-h-dvh overflow-x-clip">
      <Header step={step} canGo={{ photo: true, model: !!photo, render: renders.length > 0 }} onStep={go} demo={engine?.demo} />
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 sm:px-6 lg:px-10">
        {step === "photo" && (
          <StepPhoto
            photo={photo}
            onPhoto={(p) => {
              setPhoto(p);
              setRenders([]);
            }}
            onNext={() => go("model")}
          />
        )}
        {step === "model" && photo && (
          <StepModel
            photo={photo}
            model={model}
            options={options}
            onModel={setModel}
            onOptions={setOptions}
            onBack={() => go("photo")}
            onRender={startRender}
            resolution={engine?.resolution ?? "4K"}
          />
        )}
        {step === "render" && photo && (
          <StepRender
            photo={photo}
            renders={renders}
            currentId={current}
            onSelect={setCurrent}
            onUpdate={updateRender}
            onTryAnother={() => go("model")}
            onNewPhoto={() => go("photo")}
            engine={engine}
          />
        )}
      </main>
      <footer className="border-t border-line bg-sand/60">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>BP Cuisines Sàrl · Rue de l’Epervier 7, 2053 Cernier · <a className="underline-offset-4 hover:underline" href="tel:+41328532202">032 853 22 02</a></p>
          <p>Visualisation indicative générée par IA. Les dimensions sont confirmées lors du relevé de mesures.</p>
        </div>
      </footer>
    </div>
  );
}
