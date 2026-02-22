import type { DifficultyFeedback, EquipmentType, Exercise, Goal, Limitation, MovementPattern, Prisma, User } from "@prisma/client";
import { db } from "@/lib/db";
import {
  adjustByPhase,
  calcFatigueScore,
  nextLoadModifier,
  phaseForWeek,
  repRangeByGoal,
  shouldDeload,
  targetRpeByGoal
} from "@/lib/science";

type SessionSummary = {
  avgRpe: number;
  hardRatio: number;
  hardStreak: number;
  lastDifficulty: DifficultyFeedback | null;
};

function sampleByMovement(exercises: ExerciseWithEquipment[], movement: MovementPattern, count: number): ExerciseWithEquipment[] {
  const matches = exercises.filter((ex) => ex.movement === movement);
  return shuffle(matches).slice(0, count);
}

type ExerciseWithEquipment = Exercise & {
  equipment: { equipment: EquipmentType }[];
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueById(items: ExerciseWithEquipment[]): ExerciseWithEquipment[] {
  const seen = new Set<string>();
  const result: ExerciseWithEquipment[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function nextStepFromDifficulty(step: number, difficulty: DifficultyFeedback): number {
  if (difficulty === "TOO_EASY") return step + 1;
  if (difficulty === "TOO_HARD") return step - 1;
  return step;
}

function applyProgressionPaths(
  selected: ExerciseWithEquipment[],
  eligible: ExerciseWithEquipment[],
  latestByPath: Map<string, DifficultyFeedback>
): ExerciseWithEquipment[] {
  const byPath = new Map<string, ExerciseWithEquipment[]>();
  for (const exercise of eligible) {
    if (!exercise.progressionPath || exercise.progressionStep == null) continue;
    const list = byPath.get(exercise.progressionPath) ?? [];
    list.push(exercise);
    byPath.set(exercise.progressionPath, list);
  }

  for (const [path, list] of byPath.entries()) {
    list.sort((a, b) => (a.progressionStep ?? 1) - (b.progressionStep ?? 1));
    byPath.set(path, list);
  }

  const evolved = selected.map((exercise) => {
    const path = exercise.progressionPath;
    const step = exercise.progressionStep;
    if (!path || step == null) return exercise;

    const difficulty = latestByPath.get(path);
    if (!difficulty) return exercise;

    const candidates = byPath.get(path);
    if (!candidates || candidates.length === 0) return exercise;

    const target = nextStepFromDifficulty(step, difficulty);
    const exact = candidates.find((entry) => entry.progressionStep === target);
    if (exact) return exact;

    const currentIndex = candidates.findIndex((entry) => entry.id === exercise.id);
    if (currentIndex === -1) return exercise;

    if (difficulty === "TOO_EASY") {
      return candidates[Math.min(candidates.length - 1, currentIndex + 1)] ?? exercise;
    }
    if (difficulty === "TOO_HARD") {
      return candidates[Math.max(0, currentIndex - 1)] ?? exercise;
    }
    return exercise;
  });

  return uniqueById(evolved);
}

function isExerciseAvailable(exercise: ExerciseWithEquipment, available: Set<EquipmentType>): boolean {
  if (exercise.equipment.length === 0) {
    return true;
  }

  return exercise.equipment.some(
    (entry: { equipment: EquipmentType }) => available.has(entry.equipment) || entry.equipment === "BODYWEIGHT"
  );
}

function isExerciseSafe(exercise: ExerciseWithEquipment, limitations: Set<Limitation>): boolean {
  if (limitations.size === 0) {
    return true;
  }

  if (!exercise.contraindications || exercise.contraindications.length === 0) {
    return true;
  }

  return !exercise.contraindications.some((item: Limitation) => limitations.has(item));
}

async function getSessionSummary(userId: string): Promise<SessionSummary> {
  const recent = await db.workoutFeedback.findMany({
    where: { session: { userId } },
    orderBy: { createdAt: "desc" },
    take: 18
  });

  if (recent.length === 0) {
    return {
      avgRpe: 7,
      hardRatio: 0,
      hardStreak: 0,
      lastDifficulty: null
    };
  }

  type FeedbackEntry = (typeof recent)[number];
  const avgRpe = recent.reduce((sum: number, item: FeedbackEntry) => sum + item.avgRpe, 0) / recent.length;
  const hardCount = recent.filter((item: FeedbackEntry) => item.avgRpe >= 8.5 || item.difficulty === "TOO_HARD").length;
  const hardRatio = hardCount / recent.length;

  let hardStreak = 0;
  for (const entry of recent) {
    if (entry.avgRpe >= 8.5 || entry.difficulty === "TOO_HARD") {
      hardStreak += 1;
    } else {
      break;
    }
  }

  return {
    avgRpe,
    hardRatio,
    hardStreak,
    lastDifficulty: recent[0]?.difficulty ?? null
  };
}

async function getPeriodState(user: User): Promise<{ week: number; phase: "ACCUMULATION" | "INTENSIFICATION" | "DELOAD" }> {
  const sessionCount = await db.workoutSession.count({ where: { userId: user.id } });
  const sessionsPerWeek = Math.max(1, user.trainingDaysPerWeek);
  const cycleLength = Math.max(4, Math.min(12, user.cycleLengthWeeks));
  const weekInCycle = Math.floor(sessionCount / sessionsPerWeek) % cycleLength;
  const week = weekInCycle + 1;
  const phase = phaseForWeek(week, cycleLength);
  return { week, phase };
}

function targetExerciseCount(durationMin: number): number {
  if (durationMin <= 25) return 4;
  if (durationMin <= 40) return 5;
  if (durationMin <= 55) return 6;
  return 7;
}

export async function generateWorkoutSession(params: { userId: string; durationMin: number; goal: Goal }) {
  const { userId, durationMin, goal } = params;

  const [user, userEquip, userLimitations, allExercises, summary] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.userEquipment.findMany({ where: { userId } }),
    db.userLimitation.findMany({ where: { userId } }),
    db.exercise.findMany({ include: { equipment: true } }),
    getSessionSummary(userId)
  ]);

  const period = await getPeriodState(user);

  const available = new Set<EquipmentType>(userEquip.map((x: { equipment: EquipmentType }) => x.equipment));
  available.add("BODYWEIGHT");
  const limitations = new Set<Limitation>(userLimitations.map((entry: { limitation: Limitation }) => entry.limitation));
  const excludedSlugs = new Set<string>(user.excludedExercises ?? []);

  const eligible = allExercises.filter(
    (ex: ExerciseWithEquipment) =>
      isExerciseAvailable(ex, available) &&
      isExerciseSafe(ex, limitations) &&
      !excludedSlugs.has(ex.slug)
  );

  if (eligible.length === 0) {
    throw new Error("Keine passenden Übungen gefunden. Bitte Equipment oder Verletzungsfilter anpassen.");
  }
  const fatigueScore = calcFatigueScore(summary.avgRpe, summary.hardRatio);
  const deload = shouldDeload(fatigueScore, summary.hardStreak);
  const phaseDeload = period.phase === "DELOAD";
  const loadModifier = nextLoadModifier(summary.lastDifficulty, deload || phaseDeload);
  const targetRpe = targetRpeByGoal(goal, deload || phaseDeload);

  const count = targetExerciseCount(durationMin);
  const selected = uniqueById([
    ...sampleByMovement(eligible, "LEGS", 2),
    ...sampleByMovement(eligible, "PUSH", 1),
    ...sampleByMovement(eligible, "PULL", 1),
    ...sampleByMovement(eligible, "CORE", 1),
    ...sampleByMovement(eligible, "CONDITIONING", 1)
  ]).slice(0, count);

  const selectedPaths = selected
    .map((entry) => entry.progressionPath)
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0);

  const recentPathFeedback = selectedPaths.length
    ? await db.workoutFeedback.findMany({
        where: {
          session: { userId },
          exercise: { progressionPath: { in: selectedPaths } }
        },
        include: { exercise: true },
        orderBy: { createdAt: "desc" },
        take: 60
      })
    : [];

  const latestByPath = new Map<string, DifficultyFeedback>();
  for (const row of recentPathFeedback) {
    const path = row.exercise.progressionPath;
    if (!path || latestByPath.has(path)) continue;
    latestByPath.set(path, row.difficulty);
  }

  const progressedSelection = applyProgressionPaths(selected, eligible, latestByPath);

  const fallback = progressedSelection.length < count ? shuffle(eligible).slice(0, count - progressedSelection.length) : [];
  const finalSelection = uniqueById([...progressedSelection, ...fallback]).slice(0, count);

  const ranges = repRangeByGoal(goal);
  const baseRestSec = goal === "STRENGTH" ? 120 : 75;
  const phaseAdjusted = adjustByPhase(period.phase, {
    sets: ranges.sets,
    repsMin: ranges.repsMin,
    repsMax: ranges.repsMax,
    targetRpe,
    restSec: baseRestSec
  });

  return db.workoutSession.create({
    data: {
      userId,
      blockWeek: period.week,
      phase: period.phase,
      fatigueScore,
      deload: deload || phaseDeload,
      targetRpe: phaseAdjusted.targetRpe,
      items: {
        create: finalSelection.map((exercise) => {
          const repsMin = Math.max(phaseAdjusted.repsMin, exercise.minReps);
          const repsMax = Math.min(phaseAdjusted.repsMax, exercise.maxReps);
          return {
            exerciseId: exercise.id,
            sets: deload ? Math.max(2, phaseAdjusted.sets - 1) : phaseAdjusted.sets,
            repsMin,
            repsMax: Math.max(repsMin, repsMax),
            restSec: phaseAdjusted.restSec,
            loadModifier
          };
        })
      }
    },
    include: {
      items: {
        include: {
          exercise: {
            include: { equipment: true }
          }
        }
      }
    }
  });
}

export async function saveWorkoutFeedback(input: {
  sessionId: string;
  feedback: Array<{
    exerciseId: string;
    avgRpe: number;
    completedSets: number;
    completedReps: number;
    difficulty: DifficultyFeedback;
    notes?: string;
  }>;
}) {
  const data: Prisma.WorkoutFeedbackCreateManyInput[] = input.feedback.map((item) => ({
    sessionId: input.sessionId,
    exerciseId: item.exerciseId,
    avgRpe: item.avgRpe,
    completedSets: item.completedSets,
    completedReps: item.completedReps,
    difficulty: item.difficulty,
    notes: item.notes
  }));

  await db.workoutFeedback.createMany({ data });

  return db.workoutSession.findUnique({
    where: { id: input.sessionId },
    include: {
      items: {
        include: { exercise: true }
      },
      feedback: true
    }
  });
}
