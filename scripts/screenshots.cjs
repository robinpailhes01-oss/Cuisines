// Parcours complet automatisé + captures d'écran de chaque étape.
// Usage : node scripts/screenshots.cjs [baseUrl] [dossier]
const { chromium, devices } = require("playwright");
const path = require("path");
const BASE = process.argv[2] || "http://localhost:3000";
const OUT = process.argv[3] || "docs/screens";

async function flow(page, prefix, full) {
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${prefix}-${n}.png`), fullPage: full });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600); // animation avant/après
  await shot("01-accueil");
  await page.getByRole("button", { name: /photo d’exemple/ }).click();
  await page.getByText("Photo prête.").waitFor();
  await page.waitForTimeout(400);
  await shot("02-photo-prete");
  await page.getByRole("button", { name: /Choisir ma cuisine/ }).click();
  await page.getByText("Choisissez un modèle.").waitFor();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  await shot("03-choix-modele");
  await page.getByRole("button", { name: /^Générer/ }).locator("visible=true").last().click();
  await page.waitForTimeout(5000);
  await shot("04-rendu-en-cours");
  await page.getByText(/Votre pièce, en/).waitFor({ timeout: 60000 });
  await page.waitForTimeout(2600);
  await shot("05-rendu-termine");
}

(async () => {
  const b = await chromium.launch();
  const desk = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await flow(desk, "desktop", false);
  // Visionneuse plein écran
  await desk.getByRole("button", { name: "Voir en plein écran" }).click();
  await desk.waitForTimeout(800);
  await desk.screenshot({ path: path.join(OUT, "desktop-06-plein-ecran.png") });
  await desk.getByRole("button", { name: "Fermer" }).click();
  // Formulaire d'estimation
  await desk.fill('input[name="name"]', "Claire Exemple");
  await desk.fill('input[name="email"]', "claire@example.ch");
  await desk.fill('input[name="phone"]', "079 000 00 00");
  await desk.fill('input[name="locality"]', "2000 Neuchâtel");
  await desk.check('input[name="consent"]');
  await desk.locator("form").screenshot({ path: path.join(OUT, "desktop-07-formulaire.png") });
  await desk.getByRole("button", { name: /Estimer ma cuisine/ }).click();
  await desk.getByText("Merci, c’est noté.").waitFor();
  await desk.screenshot({ path: path.join(OUT, "desktop-08-lead-envoye.png") });

  const ctx = await b.newContext({ ...devices["iPhone 14 Pro"] });
  const mob = await ctx.newPage();
  await flow(mob, "mobile", false);
  await b.close();
  console.log("ok");
})().catch((e) => { console.error(e); process.exit(1); });
