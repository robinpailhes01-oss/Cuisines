import { z } from "zod";
import { getModel } from "@/data/catalogue";
import { checkLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

const Lead = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  locality: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  modelId: z.string().max(80),
  options: z.record(z.string(), z.unknown()).optional(),
  renderUrl: z.string().max(2000).optional(),
  consent: z.literal(true),
});

export async function POST(req: Request) {
  if (!checkLimit(`lead:${clientIp(req)}`, 10).ok) return Response.json({ error: "Trop de demandes." }, { status: 429 });
  const parsed = Lead.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Merci de vérifier le formulaire." }, { status: 400 });
  const lead = parsed.data;
  const model = getModel(lead.modelId);
  // Les rendus en data: URL (mode Gemini) ne sont pas transmis : trop lourds.
  const renderUrl = lead.renderUrl?.startsWith("http") ? lead.renderUrl : undefined;
  const payload = { ...lead, renderUrl, modelName: model?.name, receivedAt: new Date().toISOString(), source: "visualiseur" };

  const tasks: Promise<unknown>[] = [];
  if (process.env.LEAD_WEBHOOK_URL) {
    tasks.push(fetch(process.env.LEAD_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
  }
  if (process.env.RESEND_API_KEY && process.env.LEAD_EMAIL_TO) {
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.LEAD_EMAIL_FROM ?? "Visualiseur <onboarding@resend.dev>",
          to: process.env.LEAD_EMAIL_TO.split(","),
          reply_to: lead.email,
          subject: `Nouvelle demande visualiseur — ${model?.name ?? lead.modelId} — ${lead.name}`,
          html: `<h2>Demande d'estimation (visualiseur)</h2>
<p><b>Nom :</b> ${esc(lead.name)}<br><b>E-mail :</b> ${esc(lead.email)}<br><b>Téléphone :</b> ${esc(lead.phone)}<br><b>Localité :</b> ${esc(lead.locality)}</p>
<p><b>Modèle :</b> ${esc(model?.name ?? lead.modelId)}<br><b>Options :</b> ${esc(JSON.stringify(lead.options ?? {}))}</p>
<p><b>Message :</b><br>${esc(lead.message).replace(/\n/g, "<br>")}</p>
${renderUrl ? `<p><a href="${esc(renderUrl)}">Voir le rendu</a></p><img src="${esc(renderUrl)}" width="600">` : ""}`,
        }),
      }),
    );
  }
  if (tasks.length === 0) console.info("[lead] (aucune destination configurée)", payload);
  const results = await Promise.allSettled(tasks);
  if (tasks.length > 0 && results.every((r) => r.status === "rejected")) {
    return Response.json({ error: "Envoi impossible, merci d'appeler le 032 853 22 02." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
