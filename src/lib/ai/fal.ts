import type { GenerateRequest, JobState, Provider } from "./types";
import { ProviderError } from "./types";

/** fal.ai — Nano Banana Pro (edit), file d'attente asynchrone. */
const ENDPOINT = process.env.FAL_MODEL ?? "fal-ai/nano-banana-pro/edit";

function key() {
  const k = process.env.FAL_KEY;
  if (!k) throw new ProviderError("FAL_KEY manquante", 500);
  return k;
}
const headers = () => ({ Authorization: `Key ${key()}`, "Content-Type": "application/json" });

export const fal: Provider = {
  id: "fal",
  label: "Nano Banana Pro via fal.ai",
  async start(req: GenerateRequest) {
    const image_urls = req.images.map((i) => i.url ?? `data:${i.mime};base64,${i.bytes!.toString("base64")}`);
    const res = await fetch(`https://queue.fal.run/${ENDPOINT}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        prompt: req.prompt,
        image_urls,
        aspect_ratio: req.aspectRatio,
        resolution: req.resolution,
        output_format: "jpeg",
        num_images: 1,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.request_id) throw new ProviderError(`fal.ai a refusé la tâche : ${json?.detail ?? res.status}`);
    return { taskId: json.request_id as string };
  },
  async poll(taskId: string): Promise<JobState> {
    const base = `https://queue.fal.run/${ENDPOINT.split("/").slice(0, 2).join("/")}/requests/${taskId}`;
    const s = await fetch(`${base}/status`, { headers: headers(), cache: "no-store" });
    const sj = await s.json().catch(() => null);
    if (sj?.status === "COMPLETED") {
      const r = await fetch(base, { headers: headers(), cache: "no-store" });
      const rj = await r.json().catch(() => null);
      const img = rj?.images?.[0];
      if (!img?.url) return { status: "error", message: rj?.detail ?? "Le rendu a échoué" };
      return { status: "done", imageUrl: img.url, width: img.width, height: img.height };
    }
    if (!s.ok) return { status: "error", message: `fal.ai indisponible (${s.status})` };
    return { status: "pending" };
  },
};
