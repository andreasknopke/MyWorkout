import type { DifficultyFeedback, EquipmentType, Goal, Limitation, MovementPattern, PeriodPhase } from "@prisma/client";

export const GOAL_LABELS: Record<Goal, string> = {
  HYPERTROPHY: "Muskelaufbau",
  STRENGTH: "Kraft",
  ENDURANCE: "Ausdauer"
};

export const GOAL_EMOJI: Record<Goal, string> = {
  HYPERTROPHY: "💪",
  STRENGTH: "🏋️",
  ENDURANCE: "🏃"
};

export const GOAL_DESC: Record<Goal, string> = {
  HYPERTROPHY: "Muskeln aufbauen & definieren",
  STRENGTH: "Maximalkraft steigern",
  ENDURANCE: "Ausdauer & Fitness verbessern"
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  BODYWEIGHT: "Körpergewicht",
  DUMBBELL: "Kurzhanteln",
  BARBELL: "Langhantel",
  KETTLEBELL: "Kettlebell",
  PULLUP_BAR: "Klimmzugstange",
  ROWING_MACHINE: "Rudergerät",
  RESISTANCE_BAND: "Widerstandsband",
  BENCH: "Hantelbank",
  CHAIR: "Stuhl",
  CABLE_MACHINE: "Kabelzug",
  MED_BALL: "Medizinball"
};

export const EQUIPMENT_EMOJI: Record<EquipmentType, string> = {
  BODYWEIGHT: "🤸",
  DUMBBELL: "🏋️",
  BARBELL: "🏋️‍♂️",
  KETTLEBELL: "⚡",
  PULLUP_BAR: "💪",
  ROWING_MACHINE: "🚣",
  RESISTANCE_BAND: "🔗",
  BENCH: "🪑",
  CHAIR: "💺",
  CABLE_MACHINE: "⚙️",
  MED_BALL: "🏐"
};

export const LIMITATION_LABELS: Record<Limitation, string> = {
  SHOULDER_PAIN: "Schulterprobleme",
  KNEE_PAIN: "Knieprobleme",
  LOWER_BACK_PAIN: "Unterer Rücken",
  WRIST_PAIN: "Handgelenkprobleme",
  LOW_IMPACT_ONLY: "Nur gelenkschonend"
};

export const DIFFICULTY_LABELS: Record<DifficultyFeedback, string> = {
  TOO_EASY: "Zu leicht",
  JUST_RIGHT: "Genau richtig",
  TOO_HARD: "Zu schwer"
};

export const DIFFICULTY_EMOJI: Record<DifficultyFeedback, string> = {
  TOO_EASY: "😴",
  JUST_RIGHT: "👌",
  TOO_HARD: "🥵"
};

export const MOVEMENT_LABELS: Record<MovementPattern, string> = {
  PUSH: "Drücken",
  PULL: "Ziehen",
  LEGS: "Beine",
  CORE: "Rumpf",
  CONDITIONING: "Kondition",
  STRETCHING: "Dehnung"
};

export const PHASE_LABELS: Record<PeriodPhase, string> = {
  ACCUMULATION: "Aufbau",
  INTENSIFICATION: "Intensiv",
  DELOAD: "Entlastung"
};

export const PHASE_COLORS: Record<string, string> = {
  ACCUMULATION: "text-green-400",
  INTENSIFICATION: "text-orange-400",
  DELOAD: "text-blue-400"
};

export const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export const GENDER_OPTIONS = [
  { value: "MALE" as const, label: "Männlich", emoji: "♂️" },
  { value: "FEMALE" as const, label: "Weiblich", emoji: "♀️" },
  { value: "OTHER" as const, label: "Divers", emoji: "⚧️" }
];
