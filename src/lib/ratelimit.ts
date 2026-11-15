/**
 * Limiteur simple en mémoire (par instance). Suffisant pour une instance
 * unique ; en multi-instances, brancher un store partagé (Upstash Redis…).
 */
const hits = new Map<string, { count: number; day: string }>();

export function checkLimit(key: string, max: number): { ok: boolean; remaining: number } {
  const day = new Date().toISOString().slice(0, 10);
  const h = hits.get(key);
  if (!h || h.day !== day) {
    hits.set(key, { count: 1, day });
    return { ok: true, remaining: max - 1 };
  }
  if (h.count >= max) return { ok: false, remaining: 0 };
  h.count++;
  return { ok: true, remaining: max - h.count };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}
