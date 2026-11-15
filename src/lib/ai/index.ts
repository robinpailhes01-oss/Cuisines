import { demo } from "./demo";
import { fal } from "./fal";
import { gemini } from "./gemini";
import { kie } from "./kie";
import type { Provider } from "./types";

const PROVIDERS: Record<string, Provider> = { kie, fal, gemini, demo };

/**
 * Sélection du moteur : AI_PROVIDER explicite, sinon le premier fournisseur
 * dont la clé est présente, sinon le mode démo.
 */
export function getProvider(id?: string): Provider {
  if (id && PROVIDERS[id]) return PROVIDERS[id];
  const forced = process.env.AI_PROVIDER;
  if (forced && PROVIDERS[forced]) return PROVIDERS[forced];
  if (process.env.KIE_API_KEY) return kie;
  if (process.env.FAL_KEY) return fal;
  if (process.env.GEMINI_API_KEY) return gemini;
  return demo;
}

export type { Provider } from "./types";
