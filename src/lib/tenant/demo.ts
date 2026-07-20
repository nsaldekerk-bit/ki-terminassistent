import { prisma } from "@/lib/db";

/**
 * The public demo widget lives at /embed/<slug>. The slug differs per install
 * (locally "demo" from the seed, "krueger" in production), so resolve it at
 * request time instead of hardcoding: an explicit env override wins, otherwise
 * use the first tenant. Returns null when neither is available (e.g. the DB is
 * unreachable) so callers can hide the demo link instead of pointing at a dead
 * URL. Shared by the landing page and the sales sheet.
 */
export async function getDemoSlug(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_DEMO_SLUG) return process.env.NEXT_PUBLIC_DEMO_SLUG;
  try {
    const tenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "asc" },
      select: { slug: true },
    });
    return tenant?.slug ?? null;
  } catch {
    return null;
  }
}
