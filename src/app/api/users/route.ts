import { NextResponse } from "next/server";
import { z } from "zod";
import type { EquipmentType, Gender, Goal, Limitation } from "@prisma/client";
import { createUserProfile, ensureDefaultUser, listUsers } from "@/lib/defaultUser";

const createSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.number().int().min(10).max(120).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  goal: z.enum(["HYPERTROPHY", "STRENGTH", "ENDURANCE"]).default("HYPERTROPHY"),
  durationMin: z.number().int().min(15).max(120).default(40),
  trainingDaysPerWeek: z.number().int().min(1).max(7).default(3),
  cycleLengthWeeks: z.number().int().min(4).max(12).default(6),
  equipment: z
    .array(
      z.enum([
        "BODYWEIGHT",
        "DUMBBELL",
        "BARBELL",
        "KETTLEBELL",
        "PULLUP_BAR",
        "ROWING_MACHINE",
        "RESISTANCE_BAND",
        "BENCH",
        "CHAIR",
        "CABLE_MACHINE",
        "MED_BALL"
      ])
    )
    .default(["BODYWEIGHT"]),
  limitations: z
    .array(z.enum(["SHOULDER_PAIN", "KNEE_PAIN", "LOWER_BACK_PAIN", "WRIST_PAIN", "LOW_IMPACT_ONLY"]))
    .default([]),
  excludedExercises: z.array(z.string()).default([])
});

export async function GET() {
  await ensureDefaultUser();
  const users = await listUsers();
  return NextResponse.json({ ok: true, users });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const user = await createUserProfile({
      name: parsed.name,
      age: parsed.age,
      gender: parsed.gender as Gender | undefined,
      goal: parsed.goal as Goal,
      durationMin: parsed.durationMin,
      trainingDaysPerWeek: parsed.trainingDaysPerWeek,
      cycleLengthWeeks: parsed.cycleLengthWeeks,
      equipment: parsed.equipment as EquipmentType[],
      limitations: parsed.limitations as Limitation[],
      excludedExercises: parsed.excludedExercises
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Profil konnte nicht erstellt werden"
      },
      { status: 400 }
    );
  }
}
