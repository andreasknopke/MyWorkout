import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const updateSchema = z.object({
  videoUrl: z.string().url().nullable().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const exercise = await db.exercise.update({
      where: { id },
      data: {
        videoUrl: parsed.videoUrl
      },
      select: {
        id: true,
        slug: true,
        videoUrl: true
      }
    });

    return NextResponse.json({ ok: true, exercise });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Übung konnte nicht aktualisiert werden"
      },
      { status: 400 }
    );
  }
}
