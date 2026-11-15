// Optimise les visuels du catalogue : assets/source -> public/catalogue/<id>/
//  - hero.webp      2000 px (fiche modèle / comparaison)
//  - thumb.webp     4:3 800x600 (carte de sélection)
//  - g<n>.webp      galerie 1600 px
//  - ref<n>.jpg     références envoyées au moteur IA (1536 px, JPEG q90)
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CATALOGUE } from "../src/data/catalogue.ts";

const SRC = path.resolve("assets/source");
const OUT = path.resolve("public/catalogue");
const manifest = {};

for (const m of CATALOGUE) {
  const dir = path.join(OUT, m.id);
  await mkdir(dir, { recursive: true });
  const first = path.join(SRC, m.sources[0]);
  await sharp(first).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, "hero.webp"));
  await sharp(first).rotate().resize(800, 600, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(path.join(dir, "thumb.webp"));
  const gallery = [];
  for (const [i, s] of m.sources.entries()) {
    const f = `g${i}.webp`;
    const info = await sharp(path.join(SRC, s)).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(dir, f));
    gallery.push({ src: `/catalogue/${m.id}/${f}`, w: info.width, h: info.height });
  }
  const refs = [];
  for (const [k, i] of m.refs.entries()) {
    const f = `ref${k}.jpg`;
    await sharp(path.join(SRC, m.sources[i])).rotate().resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(dir, f));
    refs.push(`/catalogue/${m.id}/${f}`);
  }
  manifest[m.id] = { hero: `/catalogue/${m.id}/hero.webp`, thumb: `/catalogue/${m.id}/thumb.webp`, gallery, refs };
  console.log(`✓ ${m.id}  ${gallery.length} visuels, ${refs.length} références IA`);
}
await writeFile(path.resolve("src/data/catalogue-assets.json"), JSON.stringify(manifest, null, 2));
console.log("→ src/data/catalogue-assets.json");
