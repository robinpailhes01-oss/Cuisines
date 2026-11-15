import { getProvider } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Indique au front quel moteur est actif (et si l'on est en mode démo). */
export async function GET() {
  const p = getProvider();
  return Response.json({ provider: p.id, label: p.label, demo: p.id === "demo", resolution: process.env.RENDER_RESOLUTION || "4K" });
}
