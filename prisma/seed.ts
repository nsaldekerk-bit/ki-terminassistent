import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_ADMIN_PASSWORD = "demo1234";

const openingHours = {
  mon: [{ start: "08:00", end: "17:00" }],
  tue: [{ start: "08:00", end: "17:00" }],
  wed: [{ start: "08:00", end: "17:00" }],
  thu: [{ start: "08:00", end: "17:00" }],
  fri: [{ start: "08:00", end: "15:00" }],
  sat: [],
  sun: [],
};

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Mustermann Heizung & Sanitär",
      slug: "demo",
      plan: "v1",
    },
  });

  const location = await prisma.location.upsert({
    where: { id: `${tenant.id}-demo-location` },
    update: {},
    create: {
      id: `${tenant.id}-demo-location`,
      tenantId: tenant.id,
      name: "Hauptstandort Köln",
      address: "Musterstraße 1, 50667 Köln",
      phone: "+49 221 1234567",
      timezone: "Europe/Berlin",
      openingHours,
    },
  });

  await prisma.service.createMany({
    data: [
      {
        tenantId: tenant.id,
        locationId: location.id,
        name: "Heizungswartung",
        category: "Wartung",
        durationMinutes: 60,
        priceCents: 8900,
        isEmergency: false,
      },
      {
        tenantId: tenant.id,
        locationId: location.id,
        name: "Rohrbruch-Notdienst",
        category: "Notdienst",
        durationMinutes: 90,
        priceCents: null,
        isEmergency: true,
      },
      {
        tenantId: tenant.id,
        locationId: location.id,
        name: "Badsanierung Beratung",
        category: "Beratung",
        durationMinutes: 45,
        priceCents: 0,
        isEmergency: false,
      },
    ],
    skipDuplicates: true,
  });

  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  await prisma.adminUser.upsert({
    where: { email: "owner@demo.local" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "owner@demo.local",
      passwordHash,
    },
  });

  console.log("Seeded demo tenant:", tenant.slug);
  console.log("Admin login: owner@demo.local /", DEMO_ADMIN_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
