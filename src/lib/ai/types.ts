import type { AspectRatio } from "@/lib/prompt";

export type Resolution = "1K" | "2K" | "4K";

export interface ImageInput {
  /** Données binaires (photo client) ou URL publique (références catalogue). */
  bytes?: Buffer;
  url?: string;
  mime: string;
}

export interface GenerateRequest {
  prompt: string;
  /** images[0] = photo de la pièce, puis références du modèle. */
  images: ImageInput[];
  aspectRatio: AspectRatio;
  resolution: Resolution;
}

export type JobState =
  | { status: "pending"; progress?: number }
  | { status: "done"; imageUrl: string; width?: number; height?: number }
  | { status: "error"; message: string };

export interface Provider {
  id: string;
  label: string;
  /** Démarre un rendu. Retourne un identifiant de tâche ou directement le résultat. */
  start(req: GenerateRequest): Promise<{ taskId: string } | { result: JobState }>;
  poll(taskId: string): Promise<JobState>;
}

export class ProviderError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}
