import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

const DEFAULT_OPENING_HOURS = {
  mon: [{ start: "08:00", end: "17:00" }],
  tue: [{ start: "08:00", end: "17:00" }],
  wed: [{ start: "08:00", end: "17:00" }],
  thu: [{ start: "08:00", end: "17:00" }],
  fri: [{ start: "08:00", end: "17:00" }],
  sat: [] as { start: string; end: string }[],
  sun: [] as { start: string; end: string }[],
};

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      result[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return result;
}

function printUsage() {
  console.error(
    'Usage: npx tsx scripts/create-tenant.ts --name "Firma GmbH" --slug firma --admin-email owner@firma.de --admin-password geheim123 [--location-name "Hauptsitz"] [--timezone Europe/Berlin]'
  );
}

async function main() {
  const args = parseArgs();
  const required = ["name", "slug", "admin-email", "admin-password"];
  const missing = required.filter((key) => !args[key]);

  if (missing.length > 0) {
    console.error(`Fehlende Argumente: ${missing.map((m) => `--${m}`).join(", ")}`);
    printUsage();
    process.exit(1);
  }

  const existing = await prisma.tenant.findUnique({ where: { slug: args.slug } });
  if (existing) {
    console.error(`Ein Betrieb mit dem Slug "${args.slug}" existiert bereits.`);
    process.exit(1);
  }

  const tenant = await prisma.tenant.create({
    data: { name: args.name, slug: args.slug, plan: "v1" },
  });

  const location = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      name: args["location-name"] ?? "Hauptstandort",
      timezone: args.timezone ?? "Europe/Berlin",
      openingHours: DEFAULT_OPENING_HOURS,
    },
  });

  const passwordHash = await bcrypt.hash(args["admin-password"], 10);
  await prisma.adminUser.create({
    data: { tenantId: tenant.id, email: args["admin-email"], passwordHash },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log("Betrieb erfolgreich angelegt:");
  console.log(`  Name: ${tenant.name}`);
  console.log(`  Slug: ${tenant.slug}`);
  console.log(`  Standort: ${location.name} (${location.timezone})`);
  console.log(`  Admin-Login: ${args["admin-email"]}`);
  console.log(`  Admin-Dashboard: ${appUrl}/admin/login`);
  console.log(`  Embed-Snippet: <script src="${appUrl}/embed.js" data-key="${tenant.slug}" async></script>`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
