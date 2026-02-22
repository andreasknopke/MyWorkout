const CANDIDATE_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_PRIVATE_URL",
  "POSTGRES_URL",
  "DATABASE_PUBLIC_URL"
] as const;

function buildFromPgParts(): string | null {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  if (!host || !port || !user || !password || !database) {
    return null;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPass = encodeURIComponent(password);
  return `postgresql://${encodedUser}:${encodedPass}@${host}:${port}/${database}?schema=public`;
}

export function resolveDatabaseUrl(): string | null {
  for (const key of CANDIDATE_ENV_KEYS) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return buildFromPgParts();
}

export function validateHostedDatabaseUrl(url: string | null): void {
  const isHosted = Boolean(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
  if (!isHosted) return;

  if (!url) {
    throw new Error("DATABASE_URL fehlt in Railway. Setze DATABASE_URL als Reference auf den PostgreSQL-Service.");
  }

  if (/localhost|127\.0\.0\.1/i.test(url)) {
    throw new Error(
      "DATABASE_URL zeigt auf localhost. Setze im Railway-Webservice DATABASE_URL als Reference auf PostgreSQL (nicht localhost)."
    );
  }
}
