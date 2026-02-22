import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const exercises = await db.exercise.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        movement: true,
        primaryMuscle: true,
        videoUrl: true,
        equipment: { select: { equipment: true } },
        strainScore: true
      },
      orderBy: { name: "asc" }
    });

    // Flatten equipment relation to plain string array
    const result = exercises.map((ex) => ({
      ...ex,
      equipment: ex.equipment.map((e) => e.equipment)
    }));

    return NextResponse.json({ ok: true, exercises: result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Fehler beim Laden" },
      { status: 500 }
    );
  }
}
