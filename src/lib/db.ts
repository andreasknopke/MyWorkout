import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl, validateHostedDatabaseUrl } from "@/lib/databaseUrl";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const resolvedDatabaseUrl = resolveDatabaseUrl();
validateHostedDatabaseUrl(resolvedDatabaseUrl);

if (resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

export const db =
  global.prisma ??
  new PrismaClient(
    resolvedDatabaseUrl
      ? {
          datasources: {
            db: {
              url: resolvedDatabaseUrl
            }
          }
        }
      : undefined
  );

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
