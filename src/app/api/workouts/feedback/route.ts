import { NextResponse } from "next/server";
import { z } from "zod";
import { saveWorkoutFeedback } from "@/lib/workoutEngine";

const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  feedback: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      avgRpe: z.number().min(1).max(10),
      completedSets: z.number().int().min(1).max(10),
      completedReps: z.number().int().min(1).max(200),
      difficulty: z.enum(["TOO_EASY", "JUST_RIGHT", "TOO_HARD"]),
      notes: z.string().max(400).optional()
    })
  )
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.parse(body);
    const session = await saveWorkoutFeedback(parsed);
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Feedback konnte nicht gespeichert werden"
      },
      { status: 400 }
    );
  }
}
