const TRAINING_DAYS: Record<number, number[]> = {
  1: [3],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6]
};

const FOCUS_ROTATION: Record<number, string[]> = {
  1: ["Ganzkörper"],
  2: ["Oberkörper", "Unterkörper"],
  3: ["Drücken", "Ziehen", "Beine"],
  4: ["Oberkörper", "Unterkörper", "Drücken", "Ziehen"],
  5: ["Drücken", "Ziehen", "Beine", "Oberkörper", "Kondition"],
  6: ["Drücken", "Ziehen", "Beine", "Oberkörper", "Unterkörper", "Kondition"],
  7: ["Drücken", "Ziehen", "Beine", "Oberkörper", "Unterkörper", "Kondition", "Regeneration"]
};

export type DayPlan = {
  dayIndex: number;
  label: string;
  isTrainingDay: boolean;
  focus?: string;
  isToday: boolean;
};

export function generateWeeklySchedule(trainingDaysPerWeek: number): DayPlan[] {
  const today = new Date().getDay();
  const clamped = Math.min(7, Math.max(1, trainingDaysPerWeek));
  const days = TRAINING_DAYS[clamped] ?? TRAINING_DAYS[3];
  const focuses = FOCUS_ROTATION[days.length] ?? FOCUS_ROTATION[3];
  const dayLabels = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  return dayLabels.map((label, index) => {
    const trainingIndex = days.indexOf(index);
    const isTrainingDay = trainingIndex !== -1;
    return {
      dayIndex: index,
      label,
      isTrainingDay,
      focus: isTrainingDay ? focuses[trainingIndex % focuses.length] : undefined,
      isToday: index === today
    };
  });
}

export function isTodayTrainingDay(trainingDaysPerWeek: number): boolean {
  const today = new Date().getDay();
  const clamped = Math.min(7, Math.max(1, trainingDaysPerWeek));
  const days = TRAINING_DAYS[clamped] ?? TRAINING_DAYS[3];
  return days.includes(today);
}

export function getTodayFocus(trainingDaysPerWeek: number): string | null {
  const today = new Date().getDay();
  const clamped = Math.min(7, Math.max(1, trainingDaysPerWeek));
  const days = TRAINING_DAYS[clamped] ?? TRAINING_DAYS[3];
  const index = days.indexOf(today);
  if (index === -1) return null;
  const focuses = FOCUS_ROTATION[days.length] ?? FOCUS_ROTATION[3];
  return focuses[index % focuses.length] ?? null;
}
