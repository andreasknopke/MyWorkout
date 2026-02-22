import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl, validateHostedDatabaseUrl } from "../src/lib/databaseUrl";
import { runSeed } from "./seed-core";

const resolvedDatabaseUrl = resolveDatabaseUrl();
validateHostedDatabaseUrl(resolvedDatabaseUrl);

if (resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const prisma =
  resolvedDatabaseUrl
    ? new PrismaClient({
        datasources: {
          db: {
            url: resolvedDatabaseUrl
          }
        }
      })
    : new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL fehlt. Setze die Variable vor dem Seeding.");
  }

  const [userCount, exerciseCount] = await Promise.all([prisma.user.count(), prisma.exercise.count()]);

  if (userCount > 0 || exerciseCount > 0) {
    console.log("Seed übersprungen: Datenbank ist nicht leer.");
    return;
  }

  await runSeed(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
