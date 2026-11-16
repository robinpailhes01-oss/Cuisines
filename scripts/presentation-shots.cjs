// Écrans bruts pour la présentation au gérant (vrais rendus, mentions « démo » masquées).
// Usage : node scripts/presentation-shots.cjs <baseUrl> <dossier>
const { chromium, devices } = require("playwright");
const path = require("path");
const [BASE = "http://localhost:3000", OUT = "docs/presentation/raw"] = process.argv.slice(2);

async function hideDemo(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("span, p")) {
      const t = el.textContent || "";
      if (/^Mode démo$/i.test(t.trim()) || t.startsWith("Mode démonstration")) el.style.display = "none";
    }
    for (const el of document.querySelectorAll("span")) {
      if (el.childNodes.length && /rendu de démonstration/.test(el.textContent)) {
        el.innerHTML = el.innerHTML.replace(" · rendu de démonstration", " · rendu 4K");
      }
    }
  });
}

async function paintZone(page) {
  const canvas = page.getByLabel(/Zone à transformer/);
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  for (let y = 0.2; y <= 0.88; y += 0.045) {
    await page.mouse.move(box.x + box.width * 0.23, box.y + box.height * y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.985, box.y + box.height * y, { steps: 14 });
    await page.mouse.up();
  }
  await page.getByText(/Zone : \d+ %/).waitFor();
}

async function flow(page, prefix, isMobile) {
  const shot = async (n, opts = {}) => {
    await hideDemo(page);
    await page.screenshot({ path: path.join(OUT, `${prefix}-${n}.png`), ...opts });
  };
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2800);
  await shot("accueil");
  await page.getByRole("button", { name: /photo d’exemple/ }).click();
  await page.getByText("Photo prête.").waitFor();
  await paintZone(page);
  await page.evaluate((m) => window.scrollTo(0, m ? 180 : 140), isMobile);
  await page.waitForTimeout(300);
  await shot("zone");
  await page.getByRole("button", { name: /Choisir ma cuisine/ }).click();
  await page.getByText("Choisissez un modèle.").waitFor();
  await page.getByRole("button", { name: /Éclat lunaire/ }).first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  if (isMobile) await page.evaluate(() => window.scrollTo(0, 560));
  await shot("modele");
  await page.getByRole("button", { name: /^Générer/ }).locator("visible=true").last().click();
  await page.waitForTimeout(isMobile ? 4000 : 6000);
  await shot("calcul");
  await page.getByText(/Votre pièce, en/).waitFor({ timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.evaluate((m) => window.scrollTo(0, m ? 120 : 0), isMobile);
  await page.waitForTimeout(300);
  await shot("resultat");
  if (!isMobile) {
    // Fiche + formulaire visibles : on fait défiler jusqu'au formulaire
    await page.locator("form").fill === undefined;
    await page.fill('input[name="name"]', "Claire Exemple");
    await page.fill('input[name="email"]', "claire@example.ch");
    await page.fill('input[name="phone"]', "079 000 00 00");
    await page.fill('input[name="locality"]', "2000 Neuchâtel");
    await page.check('input[name="consent"]');
    await page.evaluate(() => window.scrollTo(0, 330));
    await page.waitForTimeout(300);
    await shot("formulaire");
  }
}

(async () => {
  const b = await chromium.launch();
  const desk = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await flow(desk, "desktop", false);
  const ctx = await b.newContext({ ...devices["iPhone 14 Pro"] });
  await flow(await ctx.newPage(), "mobile", true);

  // Maquette d'intégration sur bpcuisines.ch : bouton « Voir cette cuisine chez moi »
  const site = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await site.goto("https://www.bpcuisines.ch/realisations/eclat-lunaire", { waitUntil: "networkidle" });
  await site.waitForTimeout(1500);
  await site.evaluate(() => {
    // Ferme le bandeau cookies
    for (const b of document.querySelectorAll("button")) if (/Accepter/.test(b.textContent)) b.click();
  });
  await site.waitForTimeout(800);
  const ok = await site.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return false;
    const wrap = document.createElement("div");
    wrap.style.cssText = "margin-top:28px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;position:relative;z-index:5";
    wrap.innerHTML = `
      <a href="#" style="display:inline-flex;align-items:center;gap:10px;background:#faf7f2;color:#332e2a;border-radius:999px;padding:16px 26px;font:700 13px/1 Calibri,Carlito,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.25)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/></svg>
        Voir cette cuisine chez moi
      </a>
      <span style="font:400 15px/1.3 Calibri,Carlito,Arial,sans-serif;color:inherit;opacity:.85">Prenez votre pièce en photo · rendu 4K en 2 minutes</span>`;
    h1.parentElement.appendChild(wrap);
    window.scrollTo(0, 0);
    return true;
  });
  console.log("intégration site :", ok);
  await site.screenshot({ path: path.join(OUT, "site-integration.png") });
  await b.close();
  console.log("ok");
})().catch((e) => { console.error(e); process.exit(1); });
