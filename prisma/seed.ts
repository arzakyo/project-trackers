import { prisma } from "../src/db/prisma";
import { SEED_CARDS } from "../src/components/ProjectBoard/types";
import { auth } from "../src/lib/auth";

async function main() {
  console.log("🌱 Seeding database...");

  const defaultEmail = process.env.DEFAULT_USER_EMAIL;
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD;

  // 1. Seed Default User if configured in env
  if (defaultEmail && defaultPassword) {
    const existingUser = await prisma.user.findUnique({
      where: { email: defaultEmail },
    });

    if (!existingUser) {
      console.log(`👤 Creating default user account for ${defaultEmail}...`);
      try {
        await auth.api.signUpEmail({
          body: {
            email: defaultEmail,
            password: defaultPassword,
            name: "Arza Kyo",
          },
        });
        console.log(`✅ Default user ${defaultEmail} created successfully.`);
      } catch (err) {
        console.error("SignUp error:", err);
      }
    } else {
      console.log(`ℹ️ User ${defaultEmail} already exists.`);
    }
  }

  // 2. Seed Tracker Items (F-001 to F-010)
  console.log("📋 Seeding project board tracker items...");
  for (const item of SEED_CARDS) {
    await prisma.trackerItem.upsert({
      where: { id: item.id },
      update: {
        type: item.type,
        title: item.title,
        desc: item.desc,
        priority: item.priority,
        status: item.status,
        owner: item.owner,
        blocked: item.blocked,
        version: item.version,
        notes: item.notes,
        archived: item.archived,
        order: item.order,
      },
      create: {
        id: item.id,
        type: item.type,
        title: item.title,
        desc: item.desc,
        priority: item.priority,
        status: item.status,
        owner: item.owner,
        blocked: item.blocked,
        version: item.version,
        notes: item.notes,
        archived: item.archived,
        order: item.order,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
