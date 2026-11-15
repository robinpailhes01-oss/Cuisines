"use client";

import type { PreparedPhoto } from "./photo";
import { checkAlignment, dilate, extendZone, toGray, type AlignmentReport } from "./quality";

export interface QualityResult {
  report: AlignmentReport;
  /** Rendu exploitable : perspective conservée et pas de débordement hors zone. */
  ok: boolean;
  /** La photo d'origine a été restaurée hors de la zone. */
  restored: boolean;
  url: string;
  width: number;
  height: number;
}

/** Au-delà, Safari iOS refuse le canvas (limite ~16,7 Mpx). */
const MAX_PIXELS = 16_000_000;
const QC_W = 384;
/** Débordement toléré hors zone (ombres, reflets au bord des meubles). */
const MAX_SPILL = 0.12;

async function loadBitmap(src: string | Blob): Promise<ImageBitmap> {
  const blob = typeof src === "string" ? await (await fetch(src)).blob() : src;
  return createImageBitmap(blob, { imageOrientation: "from-image" });
}

function grayOf(source: CanvasImageSource, w: number, h: number, crop?: PreparedPhoto["crop"]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  if (crop) ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  else ctx.drawImage(source, 0, 0, w, h);
  return toGray(ctx.getImageData(0, 0, w, h).data, w, h);
}

/**
 * Contrôle le rendu puis, si une zone a été peinte et que le rendu est conforme,
 * restaure la photo d'origine (pleine résolution) hors de la zone, avec un fondu.
 */
export async function finalizeRender(resultUrl: string, photo: PreparedPhoto, zone: HTMLCanvasElement | null): Promise<QualityResult> {
  const [result, original] = await Promise.all([loadBitmap(resultUrl), loadBitmap(photo.source)]);
  const qh = Math.round((QC_W * photo.crop.h) / photo.crop.w);

  // 1. Contrôle géométrique sur des vignettes.
  const before = grayOf(original, QC_W, qh, photo.crop);
  const after = grayOf(result, QC_W, qh);
  let valid: Uint8Array | null = null;
  let area: HTMLCanvasElement | null = null; // zone finale (peinte + extension), en vignette
  if (zone) {
    const m = document.createElement("canvas");
    m.width = QC_W;
    m.height = qh;
    const mctx = m.getContext("2d", { willReadFrequently: true })!;
    mctx.drawImage(zone, 0, 0, QC_W, qh);
    const px = mctx.getImageData(0, 0, QC_W, qh);
    let bin: Uint8Array = new Uint8Array(QC_W * qh);
    for (let i = 0; i < bin.length; i++) bin[i] = px.data[i * 4 + 3] > 0 ? 1 : 0;
    // Bande d'extension : ~5 % de la largeur autour du tracé.
    bin = extendZone(bin, before, after, Math.round(QC_W * 0.05));
    for (let i = 0; i < bin.length; i++) px.data[i * 4 + 3] = bin[i] ? 255 : 0;
    mctx.putImageData(px, 0, 0);
    area = m;
    valid = dilate(bin, QC_W, qh, 4).map((v) => (v ? 0 : 1)); // marge : ombres et chants
  }
  const report = checkAlignment(before, after, valid);
  const ok = report.aligned && (!zone || report.spill <= MAX_SPILL);

  // 2. Restauration hors zone.
  if (!zone || !ok) {
    const out = { report, ok, restored: false, url: resultUrl, width: result.width, height: result.height };
    result.close();
    original.close();
    return out;
  }
  const k = Math.min(1, Math.sqrt(MAX_PIXELS / (result.width * result.height)));
  const W = Math.round(result.width * k);
  const H = Math.round(result.height * k);
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(result, 0, 0, W, H);

  // Masque adouci : dessiné petit (dilaté d'1 px verticalement), puis agrandi = fondu
  // naturel d'environ 1 % de la largeur. Sur les côtés, on reste serré pour ne pas
  // laisser passer d'objets ajoutés par l'IA à côté de la zone.
  const sw = Math.max(64, Math.round(W / 80));
  const sh = Math.round((sw * H) / W);
  const soft = document.createElement("canvas");
  soft.width = sw;
  soft.height = sh;
  const sctx = soft.getContext("2d")!;
  for (const [dx, dy] of [[0, 0], [0, 1], [0, -1]]) {
    sctx.drawImage(area!, dx, dy, sw, sh);
  }

  const orig = document.createElement("canvas");
  orig.width = W;
  orig.height = H;
  const gctx = orig.getContext("2d")!;
  gctx.imageSmoothingQuality = "high";
  gctx.drawImage(original, photo.crop.x, photo.crop.y, photo.crop.w, photo.crop.h, 0, 0, W, H);
  gctx.globalCompositeOperation = "destination-out";
  gctx.drawImage(soft, 0, 0, W, H);
  octx.drawImage(orig, 0, 0);

  const blob = await new Promise<Blob>((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("Export impossible"))), "image/jpeg", 0.92));
  orig.width = orig.height = out.width = out.height = 0; // libère la mémoire (mobiles)
  result.close();
  original.close();
  return { report, ok, restored: true, url: URL.createObjectURL(blob), width: W, height: H };
}
