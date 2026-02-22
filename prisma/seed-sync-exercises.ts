/**
 * Syncs ALL exercises from seedExercises into the DB.
 * Uses upsert so existing ones get updated, new ones get created.
 * Safe to run any time – will NOT delete exercises or users.
 */
import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl, validateHostedDatabaseUrl } from "../src/lib/databaseUrl";
import { seedExercises } from "../src/data/exercises";

const resolvedDatabaseUrl = resolveDatabaseUrl();
validateHostedDatabaseUrl(resolvedDatabaseUrl);

if (resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const prisma = resolvedDatabaseUrl
  ? new PrismaClient({ datasources: { db: { url: resolvedDatabaseUrl } } })
  : new PrismaClient();

async function main() {
  let created = 0;
  let updated = 0;

  for (const exercise of seedExercises) {
    const existing = await prisma.exercise.findUnique({ where: { slug: exercise.slug } });

    const result = await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      update: {
        name: exercise.name,
        description: exercise.description,
        movement: exercise.movement,
        primaryMuscle: exercise.primaryMuscle,
        progressionPath: exercise.progressionPath,
        progressionStep: exercise.progressionStep,
        contraindications: exercise.contraindications ?? [],
        strainScore: exercise.strainScore,
        scienceNote: exercise.scienceNote,
        videoUrl: exercise.videoUrl,
        sketchUrl: exercise.sketchUrl,
        minReps: exercise.minReps,
        maxReps: exercise.maxReps
      },
      create: {
        slug: exercise.slug,
        name: exercise.name,
        description: exercise.description,
        movement: exercise.movement,
        primaryMuscle: exercise.primaryMuscle,
        progressionPath: exercise.progressionPath,
        progressionStep: exercise.progressionStep,
        contraindications: exercise.contraindications ?? [],
        strainScore: exercise.strainScore,
        scienceNote: exercise.scienceNote,
        videoUrl: exercise.videoUrl,
        sketchUrl: exercise.sketchUrl,
        minReps: exercise.minReps,
        maxReps: exercise.maxReps
      }
    });

    // Sync equipment
    await prisma.exerciseEquipment.deleteMany({ where: { exerciseId: result.id } });
    if (exercise.equipment.length > 0) {
      await prisma.exerciseEquipment.createMany({
        data: exercise.equipment.map((equipment) => ({
          exerciseId: result.id,
          equipment
        }))
      });
    }

    if (existing) {
      updated++;
    } else {
      created++;
      console.log(`  ✚ NEU: ${exercise.name}`);
    }
  }

  console.log(`\n✅ Sync fertig: ${created} neue Übungen, ${updated} aktualisiert (${seedExercises.length} gesamt)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
