import type { DifficultyFeedback, Goal, PeriodPhase } from "@prisma/client";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calcFatigueScore(avgRpeLastWeek: number, hardSessionRatio: number): number {
  const base = Math.max(0, avgRpeLastWeek - 6.5);
  return Number((base + hardSessionRatio * 2).toFixed(2));
}

export function shouldDeload(fatigueScore: number, hardStreak: number): boolean {
  return fatigueScore >= 2.4 || hardStreak >= 3;
}

export function nextLoadModifier(lastDifficulty: DifficultyFeedback | null, deload: boolean): number {
  if (deload) {
    return 0.6;
  }

  if (lastDifficulty === "TOO_EASY") {
    return 1.05;
  }
  if (lastDifficulty === "TOO_HARD") {
    return 0.9;
  }

  return 1;
}

export function targetRpeByGoal(goal: Goal, deload: boolean): number {
  if (deload) {
    return 6;
  }

  switch (goal) {
    case "STRENGTH":
      return 8.2;
    case "ENDURANCE":
      return 7.2;
    default:
      return 8;
  }
}

export function repRangeByGoal(goal: Goal): { repsMin: number; repsMax: number; sets: number } {
  switch (goal) {
    case "STRENGTH":
      return { repsMin: 4, repsMax: 8, sets: 4 };
    case "ENDURANCE":
      return { repsMin: 12, repsMax: 20, sets: 3 };
    default:
      return { repsMin: 6, repsMax: 12, sets: 3 };
  }
}

export function phaseForWeek(week: number, cycleLengthWeeks: number): PeriodPhase {
  if (week >= cycleLengthWeeks) {
    return "DELOAD";
  }

  const progress = week / cycleLengthWeeks;
  if (progress <= 0.6) {
    return "ACCUMULATION";
  }
  return "INTENSIFICATION";
}

export function adjustByPhase(
  phase: PeriodPhase,
  base: { sets: number; repsMin: number; repsMax: number; targetRpe: number; restSec: number }
): { sets: number; repsMin: number; repsMax: number; targetRpe: number; restSec: number } {
  if (phase === "DELOAD") {
    return {
      sets: Math.max(2, base.sets - 1),
      repsMin: Math.max(4, Math.floor(base.repsMin * 0.9)),
      repsMax: Math.max(6, Math.floor(base.repsMax * 0.9)),
      targetRpe: Math.max(6, base.targetRpe - 1.2),
      restSec: Math.floor(base.restSec * 0.9)
    };
  }

  if (phase === "INTENSIFICATION") {
    return {
      sets: base.sets,
      repsMin: Math.max(3, base.repsMin - 1),
      repsMax: Math.max(base.repsMin + 1, base.repsMax - 2),
      targetRpe: Math.min(9, base.targetRpe + 0.3),
      restSec: Math.floor(base.restSec * 1.2)
    };
  }

  return base;
}
