"use client";

import { useState } from "react";
import type { RenderResult } from "./StepRender";

export function LeadForm({ render }: { render: RenderResult }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-ink p-6 text-cream">
        <p className="font-serif text-2xl">Merci, c’est noté.</p>
        <p className="mt-2 text-sm text-cream/80">L’équipe BP Cuisines vous rappelle sous 48 h pour préparer votre estimation et, si vous le souhaitez, une visite du showroom de Cernier.</p>
      </div>
    );
  }

  return (
    <form
      className="rounded-3xl bg-sand p-5 ring-1 ring-line sm:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setState("sending");
        setError(null);
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: f.get("name"),
            email: f.get("email"),
            phone: f.get("phone"),
            locality: f.get("locality"),
            message: f.get("message"),
            consent: f.get("consent") === "on",
            modelId: render.model.id,
            options: render.options,
            renderUrl: render.imageUrl,
          }),
        }).catch(() => null);
        if (res?.ok) setState("sent");
        else {
          setState("idle");
          setError((await res?.json().catch(() => null))?.error ?? "Envoi impossible. Appelez-nous au 032 853 22 02.");
        }
      }}
    >
      <p className="font-serif text-2xl leading-tight">Ce rendu vous plaît ?</p>
      <p className="mt-1 text-sm text-ink-soft">Recevez une estimation gratuite pour ce projet. Rappel sous 48 h.</p>
      <div className="mt-4 grid gap-2.5">
        <input className="field" name="name" required minLength={2} placeholder="Nom et prénom" autoComplete="name" />
        <input className="field" name="email" type="email" required placeholder="E-mail" autoComplete="email" />
        <div className="grid grid-cols-2 gap-2.5">
          <input className="field" name="phone" type="tel" placeholder="Téléphone" autoComplete="tel" />
          <input className="field" name="locality" placeholder="NPA, localité" autoComplete="postal-code" />
        </div>
        <textarea className="field min-h-20" name="message" placeholder="Dimensions, délais, envies… (facultatif)" />
        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[#332e2a]" />
          J’accepte que BP Cuisines me contacte au sujet de ce projet et reçoive le rendu généré.
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn btn-dark mt-4 w-full">
        {state === "sending" ? "Envoi…" : `Estimer ma cuisine ${render.model.name}`}
      </button>
    </form>
  );
}
