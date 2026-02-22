import type { DifficultyFeedback, EquipmentType, Goal, Limitation, MovementPattern } from "@prisma/client";

export type GenerateWorkoutInput = {
  userId: string;
  durationMin?: number;
  goal?: Goal;
};

export type ExerciseCandidate = {
  id: string;
  name: string;
  slug: string;
  movement: MovementPattern;
  minReps: number;
  maxReps: number;
  strainScore: number;
  equipment: EquipmentType[];
};

export type FeedbackInput = {
  sessionId: string;
  feedback: Array<{
    exerciseId: string;
    avgRpe: number;
    completedSets: number;
    completedReps: number;
    difficulty: DifficultyFeedback;
    notes?: string;
  }>;
};

export const EQUIPMENT_OPTIONS: EquipmentType[] = [
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
];

export const LIMITATION_OPTIONS: Limitation[] = [
  "SHOULDER_PAIN",
  "KNEE_PAIN",
  "LOWER_BACK_PAIN",
  "WRIST_PAIN",
  "LOW_IMPACT_ONLY"
];
