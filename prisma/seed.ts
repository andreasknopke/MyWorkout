import { PrismaClient } from "@prisma/client";
import { seedExercises } from "../src/data/exercises";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Familie",
      goal: "HYPERTROPHY",
      trainingDaysPerWeek: 3,
      cycleLengthWeeks: 6,
      equipment: {
        create: [{ equipment: "BODYWEIGHT" }, { equipment: "DUMBBELL" }, { equipment: "PULLUP_BAR" }]
      }
    }
  });

  await prisma.user.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Partner",
      goal: "ENDURANCE",
      trainingDaysPerWeek: 2,
      cycleLengthWeeks: 4,
      equipment: {
        create: [{ equipment: "BODYWEIGHT" }, { equipment: "ROWING_MACHINE" }, { equipment: "RESISTANCE_BAND" }]
      },
      limitations: {
        create: [{ limitation: "KNEE_PAIN" }, { limitation: "LOW_IMPACT_ONLY" }]
      }
    }
  });

  for (const exercise of seedExercises) {
    const created = await prisma.exercise.upsert({
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

    await prisma.exerciseEquipment.deleteMany({ where: { exerciseId: created.id } });

    if (exercise.equipment.length > 0) {
      await prisma.exerciseEquipment.createMany({
        data: exercise.equipment.map((equipment) => ({
          exerciseId: created.id,
          equipment
        }))
      });
    }
  }

  console.log(`Seed abgeschlossen für User ${user.name} mit ${seedExercises.length} Übungen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
