import { NextResponse } from "next/server";
import { z } from "zod";
import type { EquipmentType, Gender, Goal, Limitation } from "@prisma/client";
import { db } from "@/lib/db";
import { replaceUserEquipment, replaceUserLimitations } from "@/lib/defaultUser";

const updateSchema = z.object({
  goal: z.enum(["HYPERTROPHY", "STRENGTH", "ENDURANCE"]).optional(),
  age: z.number().int().min(10).max(120).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  durationMin: z.number().int().min(15).max(120).optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  cycleLengthWeeks: z.number().int().min(4).max(12).optional(),
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
    .optional(),
  limitations: z
    .array(z.enum(["SHOULDER_PAIN", "KNEE_PAIN", "LOWER_BACK_PAIN", "WRIST_PAIN", "LOW_IMPACT_ONLY"]))
    .optional(),
  excludedExercises: z.array(z.string()).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    await db.user.update({
      where: { id },
      data: {
        goal: parsed.goal as Goal | undefined,
        age: parsed.age,
        gender: parsed.gender as Gender | undefined,
        durationMin: parsed.durationMin,
        trainingDaysPerWeek: parsed.trainingDaysPerWeek,
        cycleLengthWeeks: parsed.cycleLengthWeeks,
        excludedExercises: parsed.excludedExercises
      }
    });

    if (parsed.equipment) {
      await replaceUserEquipment(id, parsed.equipment as EquipmentType[]);
    }

    if (parsed.limitations) {
      await replaceUserLimitations(id, parsed.limitations as Limitation[]);
    }

    const user = await db.user.findUnique({ where: { id }, include: { equipment: true, limitations: true } });
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Profil konnte nicht aktualisiert werden"
      },
      { status: 400 }
    );
  }
}
