"use client";

import { closestRatio } from "./prompt";

export interface PreparedPhoto {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  /** Largeur/hauteur d'origine (avant réduction). */
  originalWidth: number;
  originalHeight: number;
  warnings: string[];
  /** Fichier d'origine (pleine résolution) et recadrage appliqué, pour la restauration hors zone. */
  source: Blob;
  crop: { x: number; y: number; w: number; h: number };
}

const MAX_EDGE = 2560;

/**
 * Prépare la photo côté navigateur : orientation EXIF, réduction à 2560 px
 * (suffisant pour un rendu 4K, et léger à envoyer en 4G), contrôle qualité.
 */
export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  if (/heic|heif/i.test(file.type)) {
    // Safari convertit automatiquement ; les autres navigateurs ne savent pas lire le HEIC.
    try {
      await createImageBitmap(file);
    } catch {
      throw new Error("Format HEIC non lisible par ce navigateur. Exportez la photo en JPEG ou utilisez votre téléphone.");
    }
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Impossible de lire cette image. Essayez une photo JPEG ou PNG.");
  }
  // Recadrage au ratio exact que le moteur IA renverra (4:3, 16:9…) :
  // l'avant et l'après se superposent alors au pixel près.
  const [rw, rh] = closestRatio(bitmap.width, bitmap.height).split(":").map(Number);
  let cw = bitmap.width;
  let ch = Math.round((cw * rh) / rw);
  if (ch > bitmap.height) {
    ch = bitmap.height;
    cw = Math.round((ch * rw) / rh);
  }
  const crop = { x: Math.round((bitmap.width - cw) / 2), y: Math.round((bitmap.height - ch) / 2), w: cw, h: ch };
  const scale = Math.min(1, MAX_EDGE / Math.max(cw, ch));
  const width = Math.round(cw * scale);
  const height = Math.round(ch * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);

  const warnings: string[] = [];
  if (Math.max(bitmap.width, bitmap.height) < 1200) warnings.push("Photo de faible résolution : le rendu sera moins détaillé.");
  if (height > width) warnings.push("Photo en portrait : tenez le téléphone à l'horizontale pour voir toute la cuisine.");
  // Luminosité moyenne sur une vignette 64 px.
  const probe = document.createElement("canvas");
  probe.width = 64;
  probe.height = Math.max(1, Math.round((64 * height) / width));
  const pctx = probe.getContext("2d")!;
  pctx.drawImage(canvas, 0, 0, probe.width, probe.height);
  const px = pctx.getImageData(0, 0, probe.width, probe.height).data;
  let lum = 0;
  for (let i = 0; i < px.length; i += 4) lum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
  lum /= px.length / 4;
  if (lum < 55) warnings.push("Photo sombre : allumez la lumière ou ouvrez les volets pour un rendu plus fidèle.");

  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Encodage impossible"))), "image/jpeg", 0.9));
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;
  bitmap.close();
  return { blob, url: URL.createObjectURL(blob), width, height, originalWidth, originalHeight, warnings, source: file, crop };
}
