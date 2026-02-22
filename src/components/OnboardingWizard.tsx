"use client";

import { useState, useEffect } from "react";
import type { EquipmentType, Goal, Limitation } from "@prisma/client";
import {
  GOAL_LABELS,
  GOAL_EMOJI,
  GOAL_DESC,
  EQUIPMENT_LABELS,
  EQUIPMENT_EMOJI,
  LIMITATION_LABELS,
  GENDER_OPTIONS
} from "@/lib/labels";
import { EQUIPMENT_OPTIONS, LIMITATION_OPTIONS } from "@/lib/types";

type ExerciseInfo = {
  id: string;
  slug: string;
  name: string;
  description: string;
  movement: string;
  primaryMuscle: string;
};

type Props = {
  onComplete: (userId: string) => void;
  onCancel?: () => void;
};

const GOALS: Goal[] = ["HYPERTROPHY", "STRENGTH", "ENDURANCE"];

export default function OnboardingWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1
  const [name, setName] = useState("");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("");

  // Step 2
  const [goal, setGoal] = useState<Goal>("HYPERTROPHY");
  const [trainingDays, setTrainingDays] = useState(3);
  const [durationMin, setDurationMin] = useState(40);

  // Step 3
  const [equipment, setEquipment] = useState<EquipmentType[]>(["BODYWEIGHT"]);
  const [limitations, setLimitations] = useState<Limitation[]>([]);

  // Step 4
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [excludedSlugs, setExcludedSlugs] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 4) {
      fetchExercises();
    }
  }, [step]);

  async function fetchExercises() {
    try {
      const res = await fetch("/api/exercises");
      const data = await res.json();
      if (data.ok) {
        setExercises(data.exercises as ExerciseInfo[]);
      }
    } catch {
      // exercise list is optional
    }
  }

  function toggleEquipment(item: EquipmentType) {
    setEquipment((prev) => {
      if (prev.includes(item)) {
        const next = prev.filter((e) => e !== item);
        return next.length > 0 ? next : ["BODYWEIGHT" as EquipmentType];
      }
      return [...prev, item];
    });
  }

  function toggleLimitation(item: Limitation) {
    setLimitations((prev) =>
      prev.includes(item) ? prev.filter((l) => l !== item) : [...prev, item]
    );
  }

  function toggleExclusion(slug: string) {
    setExcludedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return name.trim().length >= 2;
      case 2:
        return true;
      case 3:
        return equipment.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age,
          gender: gender || undefined,
          goal,
          trainingDaysPerWeek: trainingDays,
          durationMin,
          cycleLengthWeeks: 6,
          equipment,
          limitations,
          excludedExercises: Array.from(excludedSlugs)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Fehler");
      onComplete(data.user.id as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0f1a]">
      {/* Header with progress */}
      <div className="px-4 pt-4 pb-2">
        <div className="mx-auto max-w-lg">
          {onCancel && step === 1 && (
            <button type="button" onClick={onCancel} className="btn-ghost mb-2 -ml-2">
              ← Zurück
            </button>
          )}
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            Schritt {step} von {totalSteps}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="mx-auto max-w-lg animate-fade-in" key={step}>
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold mb-1 mt-4">Willkommen! 👋</h1>
              <p className="text-slate-400 mb-6">Erzähl uns etwas über dich.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Dein Name</label>
                  <input
                    className="input-modern text-lg"
                    placeholder="z.B. Max"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Alter</label>
                  <input
                    className="input-modern text-lg"
                    type="number"
                    min={10}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Geschlecht</label>
                  <div className="grid grid-cols-3 gap-3">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        className={`selection-card ${gender === g.value ? "active" : ""}`}
                        onClick={() => setGender(g.value)}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <p className="mt-1.5 text-sm">{g.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold mb-1 mt-4">Dein Training 🎯</h1>
              <p className="text-slate-400 mb-6">Was möchtest du erreichen?</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`selection-card py-6 ${goal === g ? "active" : ""}`}
                      onClick={() => setGoal(g)}
                    >
                      <span className="text-3xl">{GOAL_EMOJI[g]}</span>
                      <p className="mt-2 font-semibold">{GOAL_LABELS[g]}</p>
                      <p className="mt-1 text-xs text-slate-400">{GOAL_DESC[g]}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Trainingstage pro Woche:{" "}
                    <span className="text-brand-400 font-bold">{trainingDays}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={trainingDays}
                    onChange={(e) => setTrainingDays(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1×</span>
                    <span>7×</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dauer pro Session:{" "}
                    <span className="text-brand-400 font-bold">{durationMin} Min</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={120}
                    step={5}
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>15 Min</span>
                    <span>120 Min</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold mb-1 mt-4">Ausrüstung & Einschränkungen ⚙️</h1>
              <p className="text-slate-400 mb-6">Was steht dir zur Verfügung?</p>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Equipment</label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`toggle-pill ${equipment.includes(item) ? "active" : ""}`}
                        onClick={() => toggleEquipment(item)}
                      >
                        {EQUIPMENT_EMOJI[item]} {EQUIPMENT_LABELS[item]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">
                    Einschränkungen
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Hast du Beschwerden? Wir passen die Übungen an.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LIMITATION_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`toggle-pill ${limitations.includes(item) ? "active" : ""}`}
                        onClick={() => toggleLimitation(item)}
                      >
                        {LIMITATION_LABELS[item]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-2xl font-bold mb-1 mt-4">Übungsauswahl 🏋️</h1>
              <p className="text-slate-400 mb-6">
                Gibt es Übungen, die du nicht machen möchtest? Tippe zum Ausschließen.
              </p>

              {exercises.length === 0 ? (
                <div className="glass p-8 text-center">
                  <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-slate-400">Lade Übungen...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {exercises.map((ex) => {
                    const excluded = excludedSlugs.has(ex.slug);
                    return (
                      <button
                        key={ex.slug}
                        type="button"
                        className={`w-full text-left glass p-3 flex items-center gap-3 transition-all ${
                          excluded ? "opacity-40" : ""
                        }`}
                        onClick={() => toggleExclusion(ex.slug)}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            excluded
                              ? "border-red-500/50 bg-red-500/20"
                              : "border-green-500/50 bg-green-500/20"
                          }`}
                        >
                          <span className="text-xs">{excluded ? "✕" : "✓"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium text-sm ${excluded ? "line-through" : ""}`}>
                            {ex.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{ex.primaryMuscle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {excludedSlugs.size > 0 && (
                <p className="mt-3 text-xs text-slate-500 text-center">
                  {excludedSlugs.size} Übung(en) ausgeschlossen
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-[#0a0f1a]/90 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
        <div className="mx-auto max-w-lg flex gap-3">
          {step > 1 && (
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setStep((s) => s - 1)}
            >
              Zurück
            </button>
          )}
          {step < totalSteps ? (
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              Weiter
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={handleFinish}
              disabled={loading || !canProceed()}
            >
              {loading ? "Wird erstellt..." : "Los geht's! 🚀"}
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-center text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
