import type { GenerateRequest, JobState, Provider } from "./types";
import { ProviderError } from "./types";

/**
 * kie.ai — passerelle vers Google Nano Banana Pro (Gemini 3 Pro Image).
 * Sortie 4K native, jusqu'à 8 images d'entrée. Doc : https://docs.kie.ai
 */
const API = "https://api.kie.ai/api/v1";
const UPLOAD = process.env.KIE_UPLOAD_URL ?? "https://kieai.redpandaai.co/api/file-base64-upload";
const MODEL = process.env.KIE_MODEL ?? "nano-banana-pro";

function key() {
  const k = process.env.KIE_API_KEY;
  if (!k) throw new ProviderError("KIE_API_KEY manquante", 500);
  return k;
}

async function upload(bytes: Buffer, mime: string): Promise<string> {
  const res = await fetch(UPLOAD, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      base64Data: `data:${mime};base64,${bytes.toString("base64")}`,
      uploadPath: "bpc-visualiseur",
      fileName: `${Date.now()}-${Math.random().toString(36).slice(2)}.${mime.split("/")[1] ?? "jpg"}`,
    }),
  });
  const json = await res.json().catch(() => null);
  const url = json?.data?.downloadUrl ?? json?.data?.fileUrl;
  if (!res.ok || !url) throw new ProviderError(`Upload kie.ai impossible (${res.status}) ${json?.msg ?? ""}`);
  return url;
}

export const kie: Provider = {
  id: "kie",
  label: "Nano Banana Pro via kie.ai",
  async start(req: GenerateRequest) {
    const urls = await Promise.all(req.images.map((i) => (i.url ? i.url : upload(i.bytes!, i.mime))));
    const res = await fetch(`${API}/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        input: {
          prompt: req.prompt,
          image_input: urls,
          aspect_ratio: req.aspectRatio,
          resolution: req.resolution,
          output_format: "jpg",
        },
      }),
    });
    const json = await res.json().catch(() => null);
    const taskId = json?.data?.taskId;
    if (!res.ok || json?.code !== 200 || !taskId) {
      throw new ProviderError(`kie.ai a refusé la tâche : ${json?.msg ?? res.status}`, json?.code === 402 ? 402 : 502);
    }
    return { taskId };
  },
  async poll(taskId: string): Promise<JobState> {
    const res = await fetch(`${API}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${key()}` },
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    const d = json?.data;
    if (!res.ok || !d) return { status: "error", message: `kie.ai indisponible (${res.status})` };
    if (d.state === "success") {
      const r = typeof d.resultJson === "string" ? JSON.parse(d.resultJson) : d.resultJson;
      const url = r?.resultUrls?.[0];
      return url ? { status: "done", imageUrl: url } : { status: "error", message: "Résultat vide" };
    }
    if (d.state === "fail") return { status: "error", message: d.failMsg || "Le rendu a échoué" };
    return { status: "pending", progress: typeof d.progress === "number" ? d.progress : undefined };
  },
};
