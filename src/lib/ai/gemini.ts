import sharp from "sharp";
import type { GenerateRequest, Provider } from "./types";
import { ProviderError } from "./types";

/**
 * Google Gemini API en direct (Gemini 3 Pro Image = « Nano Banana Pro »).
 * Appel synchrone (~30-90 s) : le résultat est renvoyé directement.
 */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3-pro-image-preview";

async function toBase64(i: GenerateRequest["images"][number]) {
  if (i.bytes) return { mime: i.mime, data: i.bytes.toString("base64") };
  const r = await fetch(i.url!);
  if (!r.ok) throw new ProviderError(`Référence introuvable : ${i.url}`);
  return { mime: r.headers.get("content-type") ?? i.mime, data: Buffer.from(await r.arrayBuffer()).toString("base64") };
}

export const gemini: Provider = {
  id: "gemini",
  label: "Gemini 3 Pro Image (Google)",
  async start(req: GenerateRequest) {
    const k = process.env.GEMINI_API_KEY;
    if (!k) throw new ProviderError("GEMINI_API_KEY manquante", 500);
    const images = await Promise.all(req.images.map(toBase64));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": k, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: req.prompt },
              ...images.map((i) => ({ inline_data: { mime_type: i.mime, data: i.data } })),
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: req.aspectRatio, imageSize: req.resolution },
        },
      }),
    });
    const json = await res.json().catch(() => null);
    const part = json?.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown; inline_data?: unknown }) => p.inlineData ?? p.inline_data);
    const data: string | undefined = part?.inlineData?.data ?? part?.inline_data?.data;
    if (!res.ok || !data) throw new ProviderError(`Gemini : ${json?.error?.message ?? "aucune image renvoyée"}`);
    // Ré-encodage JPEG haute qualité : poids divisé par ~4 par rapport au PNG.
    const jpg = await sharp(Buffer.from(data, "base64")).jpeg({ quality: 92, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    return {
      result: {
        status: "done",
        imageUrl: `data:image/jpeg;base64,${jpg.data.toString("base64")}`,
        width: jpg.info.width,
        height: jpg.info.height,
      },
    };
  },
  async poll() {
    return { status: "error", message: "Gemini est synchrone" };
  },
};
