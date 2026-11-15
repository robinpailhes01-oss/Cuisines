// Parcours avec zone peinte : photo d'exemple → zone → modèle → rendu → contrôle qualité.
// Usage : node scripts/test-zone.cjs <baseUrl> <dossierCaptures> [idModèle]
const { chromium } = require("playwright");
const path = require("path");
const [BASE = "http://localhost:3000", OUT = "docs/screens", MODEL] = process.argv.slice(2);

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on("console", (m) => m.type() === "error" && console.log("[console]", m.text()));
  page.on("response", async (r) => {
    if (!r.url().includes("/api/render/")) return;
    const j = await r.json().catch(() => null);
    if (j?.status === "done") console.log("image IA brute :", j.imageUrl);
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /photo d’exemple/ }).click();
  await page.getByText("Photo prête.").waitFor();
  const canvas = page.getByLabel(/Zone à transformer/);
  const box = await canvas.boundingBox();
  // Zone : le mur de la cuisine existante (22 → 98 % en largeur, 22 → 86 % en hauteur)
  for (let y = 0.22; y <= 0.86; y += 0.05) {
    await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.98, box.y + box.height * y, { steps: 12 });
    await page.mouse.up();
  }
  await page.getByText(/Zone : \d+ %/).waitFor();
  await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, "desktop-09-zone.png") });
  await page.getByRole("button", { name: /Choisir ma cuisine/ }).click();
  await page.getByText("Choisissez un modèle.").waitFor();
  if (MODEL) await page.getByRole("button", { name: new RegExp(MODEL, "i") }).first().click();
  const t0 = Date.now();
  await page.getByRole("button", { name: /^Générer/ }).locator("visible=true").last().click();
  await page.getByText(/Votre pièce, en|n’a pas abouti/).waitFor({ timeout: 480_000 });
  console.log("durée", Math.round((Date.now() - t0) / 1000), "s");
  await page.waitForTimeout(2600);
  const badges = await page.getByLabel("Contrôle qualité").locator("li").allInnerTexts().catch(() => []);
  console.log("contrôle qualité :", badges);
  const size = await page.locator("text=/\\d+ × \\d+ px/").first().innerText().catch(() => "?");
  console.log("taille :", size);
  await page.screenshot({ path: path.join(OUT, `desktop-10-rendu-zone${MODEL ? "-" + MODEL.replace(/\W+/g, "-") : ""}.png`) });
  // Image finale (après restauration) pour inspection
  const src = await page.locator('img[alt^="Après"]').first().getAttribute("src");
  if (src?.startsWith("blob:")) {
    const b64 = await page.evaluate(async (u) => {
      const buf = await (await fetch(u)).arrayBuffer();
      let s = ""; const v = new Uint8Array(buf);
      for (let i = 0; i < v.length; i += 0x8000) s += String.fromCharCode(...v.subarray(i, i + 0x8000));
      return btoa(s);
    }, src);
    require("fs").writeFileSync(path.join(OUT, `final${MODEL ? "-" + MODEL.replace(/\W+/g, "-") : ""}.jpg`), Buffer.from(b64, "base64"));
    console.log("image finale enregistrée");
  } else console.log("image finale :", src);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
