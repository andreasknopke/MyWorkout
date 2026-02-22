import { NextResponse } from "next/server";
import { z } from "zod";
import type { EquipmentType, Goal, Limitation } from "@prisma/client";
import { db } from "@/lib/db";
import { ensureDefaultUser, replaceUserEquipment, replaceUserLimitations } from "@/lib/defaultUser";
import { generateWorkoutSession } from "@/lib/workoutEngine";

const schema = z.object({
  userId: z.string().uuid().optional(),
  durationMin: z.number().min(15).max(120).default(40),
  goal: z.enum(["HYPERTROPHY", "STRENGTH", "ENDURANCE"]).default("HYPERTROPHY"),
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
    .default([])
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const user = parsed.userId
      ? await db.user.findUnique({ where: { id: parsed.userId } })
      : await ensureDefaultUser(parsed.goal as Goal);

    if (!user) {
      throw new Error("Profil nicht gefunden");
    }

    await replaceUserEquipment(user.id, parsed.equipment as EquipmentType[]);
    await replaceUserLimitations(user.id, parsed.limitations as Limitation[]);

    const session = await generateWorkoutSession({
      userId: user.id,
      durationMin: parsed.durationMin,
      goal: parsed.goal as Goal
    });

    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unbekannter Fehler"
      },
      { status: 400 }
    );
  }
}
