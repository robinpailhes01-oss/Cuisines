import { getProvider } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const dot = id.indexOf(".");
  if (dot < 0) return Response.json({ status: "error", message: "Identifiant invalide" }, { status: 400 });
  const provider = getProvider(id.slice(0, dot));
  try {
    const state = await provider.poll(id.slice(dot + 1));
    return Response.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ status: "error", message: e instanceof Error ? e.message : "Erreur" }, { status: 502 });
  }
}
