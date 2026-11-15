/**
 * Contrôle qualité géométrique d'un rendu (fonctions pures, sans DOM).
 *
 * Principe : l'architecture de la pièce (fenêtres, angles, plafond, portes)
 * forme des contours stables. On compare les contours de la photo d'origine
 * et du rendu, hors de la zone transformée. Si le meilleur recalage est
 * l'identité, la perspective n'a pas bougé : le rendu est « aligné » et la
 * photo d'origine peut être restaurée au pixel près hors de la zone.
 */

export interface GrayImage {
  data: Float32Array; // luminance 0..1
  width: number;
  height: number;
}

export interface AlignmentReport {
  /** Erreur moyenne des contours sans recalage. */
  identityError: number;
  /** Meilleure erreur trouvée et le recalage correspondant. */
  bestError: number;
  best: { dx: number; dy: number; scale: number };
  /** Vrai si l'identité est (quasi) le meilleur recalage. */
  aligned: boolean;
  /** Corrélation des contours hors zone, 0..1 (1 = architecture identique). */
  similarity: number;
  /** Part de la surface hors zone que l'IA a modifiée (0..1). */
  spill: number;
}

/** RGBA (Uint8ClampedArray) → luminance. */
export function toGray(rgba: Uint8ClampedArray, width: number, height: number): GrayImage {
  const data = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i++, p += 4) {
    data[i] = (0.2126 * rgba[p] + 0.7152 * rgba[p + 1] + 0.0722 * rgba[p + 2]) / 255;
  }
  return { data, width, height };
}

/** Magnitude du gradient de Sobel. */
export function edges(img: GrayImage): GrayImage {
  const { data, width: w, height: h } = img;
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -data[i - w - 1] - 2 * data[i - 1] - data[i + w - 1] + data[i - w + 1] + 2 * data[i + 1] + data[i + w + 1];
      const gy =
        -data[i - w - 1] - 2 * data[i - w] - data[i - w + 1] + data[i + w - 1] + 2 * data[i + w] + data[i + w + 1];
      out[i] = Math.min(1, Math.hypot(gx, gy));
    }
  }
  return { data: out, width: w, height: h };
}

/** Échantillonnage bilinéaire avec transformation centrée (échelle + translation). */
function sample(img: GrayImage, x: number, y: number, t: { dx: number; dy: number; scale: number }): number {
  const cx = img.width / 2;
  const cy = img.height / 2;
  const sx = (x - cx) * t.scale + cx + t.dx;
  const sy = (y - cy) * t.scale + cy + t.dy;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  if (x0 < 0 || y0 < 0 || x0 >= img.width - 1 || y0 >= img.height - 1) return -1;
  const fx = sx - x0;
  const fy = sy - y0;
  const i = y0 * img.width + x0;
  const d = img.data;
  return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + img.width] * (1 - fx) + d[i + img.width + 1] * fx) * fy;
}

function meanError(a: GrayImage, b: GrayImage, valid: Uint8Array | null, t: { dx: number; dy: number; scale: number }) {
  let sum = 0;
  let n = 0;
  // Marge de 10 % : on ignore les bords, sensibles au recadrage.
  const mx = Math.round(a.width * 0.1);
  const my = Math.round(a.height * 0.1);
  for (let y = my; y < a.height - my; y += 1) {
    for (let x = mx; x < a.width - mx; x += 1) {
      const i = y * a.width + x;
      if (valid && !valid[i]) continue;
      // Seuls les contours nets de la photo d'origine (architecture) comptent.
      if (a.data[i] < 0.12) continue;
      const v = sample(b, x, y, t);
      if (v < 0) continue;
      sum += Math.min(0.5, Math.abs(a.data[i] - v));
      n++;
    }
  }
  return n > 0 ? sum / n : Infinity;
}

function correlation(a: GrayImage, b: GrayImage, valid: Uint8Array | null): number {
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
  for (let i = 0; i < a.data.length; i++) {
    if (valid && !valid[i]) continue;
    const x = a.data[i];
    const y = b.data[i];
    sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; n++;
  }
  if (n === 0) return 0;
  const cov = sab / n - (sa / n) * (sb / n);
  const va = saa / n - (sa / n) ** 2;
  const vb = sbb / n - (sb / n) ** 2;
  return va > 0 && vb > 0 ? Math.max(0, cov / Math.sqrt(va * vb)) : 0;
}

/**
 * Compare l'architecture de deux images de même taille.
 * `valid` (optionnel) : 1 = pixel à comparer (hors zone transformée).
 */
export function checkAlignment(before: GrayImage, after: GrayImage, valid: Uint8Array | null = null): AlignmentReport {
  const ea = edges(before);
  const eb = edges(after);
  const id = { dx: 0, dy: 0, scale: 1 };
  const identityError = meanError(ea, eb, valid, id);
  let best = id;
  let bestError = identityError;
  const step = Math.max(2, Math.round(before.width / 128));
  for (const scale of [0.97, 0.985, 1, 1.015, 1.03]) {
    for (const dx of [-3, -2, -1, 0, 1, 2, 3].map((k) => k * step)) {
      for (const dy of [-3, -2, -1, 0, 1, 2, 3].map((k) => k * step)) {
        if (scale === 1 && dx === 0 && dy === 0) continue;
        const t = { dx, dy, scale };
        const e = meanError(ea, eb, valid, t);
        if (e < bestError) {
          bestError = e;
          best = t;
        }
      }
    }
  }
  // Aligné si aucun recalage n'améliore l'erreur de plus de 4 %.
  const aligned = identityError <= bestError * 1.04;
  return { identityError, bestError, best, aligned, similarity: correlation(ea, eb, valid), spill: changedRatio(before, after, valid) };
}

/**
 * Carte des blocs (8×8) dont la structure a nettement changé entre a et b.
 * Les variations globales d'exposition sont neutralisées : on compare les
 * écarts à la moyenne de chaque bloc, pas les valeurs brutes.
 */
export function changedBlocks(a: GrayImage, b: GrayImage, block = 8): Uint8Array {
  const out = new Uint8Array(a.width * a.height);
  for (let by = 0; by < a.height; by += block) {
    for (let bx = 0; bx < a.width; bx += block) {
      const ye = Math.min(a.height, by + block);
      const xe = Math.min(a.width, bx + block);
      let ma = 0, mb = 0, n = 0;
      for (let y = by; y < ye; y++)
        for (let x = bx; x < xe; x++) {
          const i = y * a.width + x;
          ma += a.data[i]; mb += b.data[i]; n++;
        }
      ma /= n; mb /= n;
      let d = 0;
      for (let y = by; y < ye; y++)
        for (let x = bx; x < xe; x++) {
          const i = y * a.width + x;
          d += Math.abs(a.data[i] - ma - (b.data[i] - mb));
        }
      if (d / n > 0.06 || Math.abs(ma - mb) > 0.25) {
        for (let y = by; y < ye; y++) out.fill(1, y * a.width + bx, y * a.width + xe);
      }
    }
  }
  return out;
}

/** Part des pixels hors zone (valid = 1) qui ont changé. */
export function changedRatio(a: GrayImage, b: GrayImage, valid: Uint8Array | null): number {
  const ch = changedBlocks(a, b);
  let n = 0, c = 0;
  for (let i = 0; i < ch.length; i++) {
    if (valid && !valid[i]) continue;
    n++;
    c += ch[i];
  }
  return n ? c / n : 0;
}

/**
 * Étend la zone peinte aux changements faits par l'IA juste à côté du tracé
 * (ex. pied d'un ancien frigo oublié par le client), dans une bande limitée.
 * Un vrai débordement (îlot au milieu de la pièce) reste hors zone et sera détecté.
 */
export function extendZone(zone: Uint8Array, a: GrayImage, b: GrayImage, band: number): Uint8Array {
  const { width: w, height: h } = a;
  const ch = changedBlocks(a, b);
  // Bande surtout verticale : les oublis typiques sont les pieds de meubles
  // et le haut des colonnes. Sur les côtés, l'IA ajoute plutôt des objets parasites.
  const near = dilateXY(zone, w, h, Math.max(1, Math.round(w * 0.01)), band);
  const out = zone.slice();
  // On ne garde que les changements reliés au tracé (remplissage par diffusion).
  const queue: number[] = [];
  for (let i = 0; i < zone.length; i++) if (zone[i]) queue.push(i);
  while (queue.length) {
    const i = queue.pop()!;
    const x = i % w;
    for (const j of [i - 1, i + 1, i - w, i + w]) {
      if (j < 0 || j >= out.length || out[j]) continue;
      if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue;
      if (near[j] && ch[j]) {
        out[j] = 1;
        queue.push(j);
      }
    }
  }
  return out;
}

/** Dilate un masque binaire (rayon en pixels, carré) : la zone protégée s'éloigne du bord du mobilier. */
export function dilate(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  return dilateXY(mask, width, height, radius, radius);
}

/** Dilatation rectangulaire (rayons horizontal et vertical distincts). */
export function dilateXY(mask: Uint8Array, width: number, height: number, rx: number, ry: number): Uint8Array {
  if (rx <= 0 && ry <= 0) return mask;
  const tmp = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let k = -rx; k <= rx && !v; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < width && mask[y * width + xx]) v = 1;
      }
      tmp[y * width + x] = v;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let k = -ry; k <= ry && !v; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < height && tmp[yy * width + x]) v = 1;
      }
      out[y * width + x] = v;
    }
  }
  return out;
}
