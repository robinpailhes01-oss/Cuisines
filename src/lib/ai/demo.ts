import type { JobState, Provider } from "./types";

/**
 * Mode démo : aucune clé API configurée. Simule un rendu (~12 s) et renvoie
 * un rendu pré-calculé correspondant au modèle choisi s'il existe.
 * Permet de présenter l'outil hors ligne (salon, rendez-vous client).
 */
const started = new Map<string, { at: number; model: string }>();
/** Rendus réels pré-calculés sur la photo d'exemple, par nom de modèle. */
const DEMO_RENDERS: Record<string, string> = {
  "Graphite chaleureux": "/demo/apres-graphite-chaleureux.jpg",
  "Écrin de sauge": "/demo/apres-cuisine-verte.jpg",
};
const DURATION = 12_000;

export const demo: Provider = {
  id: "demo",
  label: "Mode démonstration",
  async start(req) {
    const model = /kitchen model "([^"]+)"/.exec(req.prompt)?.[1] ?? "";
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    started.set(id, { at: Date.now(), model });
    return { taskId: id };
  },
  async poll(taskId): Promise<JobState> {
    const s = started.get(taskId);
    const elapsed = s ? Date.now() - s.at : DURATION;
    if (elapsed < DURATION) return { status: "pending", progress: Math.round((elapsed / DURATION) * 100) };
    // DEMO_RENDER_URL : rejoue un rendu existant (tests du contrôle qualité sans coût IA).
    return { status: "done", imageUrl: process.env.DEMO_RENDER_URL || DEMO_RENDERS[s?.model ?? ""] || DEMO_RENDERS["Graphite chaleureux"] };
  },
};
