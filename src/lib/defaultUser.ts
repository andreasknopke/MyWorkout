import type { EquipmentType, Gender, Goal, Limitation } from "@prisma/client";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function ensureDefaultUser(goal?: Goal) {
  return db.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: goal ? { goal } : {},
    create: {
      id: DEFAULT_USER_ID,
      name: "Familie",
      goal: goal ?? "HYPERTROPHY",
      trainingDaysPerWeek: 3,
      cycleLengthWeeks: 6,
      durationMin: 40
    }
  });
}

export async function listUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { equipment: true, limitations: true }
  });
}

export async function createUserProfile(input: {
  name: string;
  age?: number;
  gender?: Gender;
  goal: Goal;
  durationMin?: number;
  trainingDaysPerWeek: number;
  cycleLengthWeeks: number;
  equipment: EquipmentType[];
  limitations: Limitation[];
  excludedExercises?: string[];
}) {
  const created = await db.user.create({
    data: {
      name: input.name,
      age: input.age,
      gender: input.gender,
      goal: input.goal,
      durationMin: input.durationMin ?? 40,
      trainingDaysPerWeek: input.trainingDaysPerWeek,
      cycleLengthWeeks: input.cycleLengthWeeks,
      excludedExercises: input.excludedExercises ?? []
    }
  });

  await Promise.all([replaceUserEquipment(created.id, input.equipment), replaceUserLimitations(created.id, input.limitations)]);

  return db.user.findUnique({ where: { id: created.id }, include: { equipment: true, limitations: true } });
}

export async function updateUserGoal(userId: string, goal: Goal) {
  return db.user.update({ where: { id: userId }, data: { goal } });
}

export async function replaceUserEquipment(userId: string, equipment: EquipmentType[]) {
  await db.userEquipment.deleteMany({ where: { userId } });

  const normalized: EquipmentType[] = equipment.length > 0 ? equipment : ["BODYWEIGHT"];

  await db.userEquipment.createMany({
    data: normalized.map((entry) => ({
      userId,
      equipment: entry
    })),
    skipDuplicates: true
  });
}

export async function replaceUserLimitations(userId: string, limitations: Limitation[]) {
  await db.userLimitation.deleteMany({ where: { userId } });

  if (limitations.length === 0) {
    return;
  }

  await db.userLimitation.createMany({
    data: limitations.map((entry) => ({
      userId,
      limitation: entry
    })),
    skipDuplicates: true
  });
}

export { DEFAULT_USER_ID };
