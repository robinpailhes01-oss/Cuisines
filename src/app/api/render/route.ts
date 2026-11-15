import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import assets from "@/data/catalogue-assets.json";
import { getModel } from "@/data/catalogue";
import { getProvider } from "@/lib/ai";
import { ProviderError, type Resolution } from "@/lib/ai/types";
import { buildRenderPrompt, closestRatio, DEFAULT_OPTIONS } from "@/lib/prompt";
import { checkLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 300;

const OptionsSchema = z.object({
  layout: z.enum(["auto", "linear", "l-shape", "island"]).default("auto"),
  ambiance: z.enum(["daylight", "evening"]).default("daylight"),
  floor: z.enum(["keep", "refresh"]).default("keep"),
  declutter: z.boolean().default(true),
});

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 2560;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const photo = form.get("photo");
    const model = getModel(String(form.get("modelId") ?? ""));
    if (!(photo instanceof Blob) || photo.size === 0) return json({ error: "Photo manquante." }, 400);
    if (photo.size > MAX_BYTES) return json({ error: "Photo trop lourde (12 Mo max)." }, 413);
    if (!model) return json({ error: "Modèle inconnu." }, 400);

    const parsed = OptionsSchema.safeParse(JSON.parse(String(form.get("options") ?? "{}")));
    const options = parsed.success ? parsed.data : DEFAULT_OPTIONS;

    const limit = Number(process.env.RENDER_LIMIT_PER_DAY ?? 20);
    const provider = getProvider();
    if (provider.id !== "demo") {
      const rl = checkLimit(clientIp(req), limit);
      if (!rl.ok) return json({ error: "Limite quotidienne de rendus atteinte. Revenez demain ou contactez-nous." }, 429);
    }

    // Normalisation : orientation EXIF, taille maîtrisée, JPEG.
    const room = await sharp(Buffer.from(await photo.arrayBuffer()))
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer({ resolveWithObject: true });
    if (Math.max(room.info.width, room.info.height) < 640) {
      return json({ error: "Photo trop petite : au moins 640 px de large." }, 422);
    }

    // Zone à transformer (optionnelle) : masque blanc sur noir peint par le client.
    const zone = form.get("mask");
    let guide: Buffer | null = null;
    if (zone instanceof Blob && zone.size > 0 && zone.size < 4 * 1024 * 1024) {
      const { width, height } = room.info;
      const alpha = await sharp(Buffer.from(await zone.arrayBuffer()))
        .resize(width, height, { fit: "fill" })
        .greyscale()
        .threshold(128)
        .linear(0.5, 0) // 50 % d'opacité pour le voile rouge
        .toColourspace("b-w")
        .raw()
        .toBuffer();
      const coverage = alpha.reduce((n, v) => n + (v > 0 ? 1 : 0), 0) / alpha.length;
      if (coverage > 0.01) {
        const red = await sharp({ create: { width, height, channels: 3, background: { r: 232, g: 35, b: 30 } } })
          .joinChannel(alpha, { raw: { width, height, channels: 1 } })
          .png()
          .toBuffer();
        guide = await sharp(room.data).composite([{ input: red }]).jpeg({ quality: 88 }).toBuffer();
      }
    }

    const refPaths = (assets as Record<string, { refs: string[] }>)[model.id].refs;
    const refs = await Promise.all(
      refPaths.map(async (p) => ({ bytes: await readFile(path.join(process.cwd(), "public", p)), mime: "image/jpeg" })),
    );

    const resolution = (process.env.RENDER_RESOLUTION as Resolution) || "4K";
    const aspectRatio = closestRatio(room.info.width, room.info.height);
    const prompt = buildRenderPrompt(model, options, refs.length, !!guide);

    const started = await provider.start({
      prompt,
      images: [
        { bytes: room.data, mime: "image/jpeg" },
        ...(guide ? [{ bytes: guide, mime: "image/jpeg" }] : []),
        ...refs,
      ],
      aspectRatio,
      resolution,
    });

    const meta = { provider: provider.id, demo: provider.id === "demo", resolution, aspectRatio, zone: !!guide };
    if ("result" in started) return json({ ...meta, jobId: null, ...started.result });
    return json({ ...meta, jobId: `${provider.id}.${started.taskId}`, status: "pending" });
  } catch (e) {
    const status = e instanceof ProviderError ? e.status : 500;
    console.error("[render]", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inattendue" }, status);
  }
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
