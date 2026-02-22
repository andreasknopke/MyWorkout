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
        primaryMuscle: true
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ ok: true, exercises });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Fehler beim Laden" },
      { status: 500 }
    );
  }
}
