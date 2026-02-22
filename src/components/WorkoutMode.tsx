"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DifficultyFeedback } from "@prisma/client";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_EMOJI,
  MOVEMENT_LABELS,
  PHASE_LABELS,
  PHASE_COLORS
} from "@/lib/labels";
import Image from "next/image";
import RestTimer from "./RestTimer";
import YouTubePlayer from "./YouTubePlayer";

type WorkoutItem = {
  id: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  loadModifier: number;
  exercise: {
    id: string;
    name: string;
    scienceNote: string;
    movement: string;
    primaryMuscle: string;
    videoUrl?: string | null;
    sketchUrl?: string | null;
  };
};

type GeneratedSession = {
  id: string;
  targetRpe: number;
  fatigueScore: number;
  deload: boolean;
  phase: "ACCUMULATION" | "INTENSIFICATION" | "DELOAD";
  blockWeek: number;
  items: WorkoutItem[];
};

type FeedbackRow = {
  exerciseId: string;
  avgRpe: number;
  completedSets: number;
  completedReps: number;
  difficulty: DifficultyFeedback;
  notes: string;
};

type Phase = "overview" | "exercise" | "feedback" | "rest" | "cooldown" | "done";

const COOLDOWN_STEPS = [
  {
    name: "Tiefe Atmung",
    duration: 60,
    emoji: "🌬️",
    description: "Atme 4 Sek. ein, halte 4 Sek., atme 6 Sek. aus. Wiederhole."
  },
  {
    name: "Stehende Vorbeuge",
    duration: 30,
    emoji: "🙆",
    description: "Oberkörper locker nach vorne hängen lassen, Knie leicht gebeugt."
  },
  {
    name: "Hüftbeuger-Dehnung",
    duration: 60,
    emoji: "🦵",
    description: "Kniender Ausfallschritt, 30 Sek. pro Seite."
  },
  {
    name: "Schulterkreise",
    duration: 30,
    emoji: "🔄",
    description: "Große Kreise, 15 Sek. vorwärts, 15 Sek. rückwärts."
  },
  {
    name: "Child's Pose",
    duration: 45,
    emoji: "🧘",
    description: "Knie am Boden, Arme nach vorne, Stirn ablegen. Entspannen."
  }
];

const DIFFICULTIES: DifficultyFeedback[] = ["TOO_EASY", "JUST_RIGHT", "TOO_HARD"];

type Props = {
  session: GeneratedSession;
  onComplete: () => void;
  onExit: () => void;
};

export default function WorkoutMode({ session, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("overview");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackRow | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [cooldownStep, setCooldownStep] = useState(0);
  const startTimeRef = useRef<Date | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (phase === "done" || phase === "overview") return;
    if (!startTimeRef.current) return;
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current!.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const currentItem = session.items[currentIndex];
  const totalExercises = session.items.length;

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function startWorkout() {
    startTimeRef.current = new Date();
    setPhase("exercise");
  }

  function finishExercise() {
    if (!currentItem) return;
    setCurrentFeedback({
      exerciseId: currentItem.exercise.id,
      avgRpe: session.targetRpe,
      completedSets: currentItem.sets,
      completedReps: currentItem.repsMax,
      difficulty: "JUST_RIGHT",
      notes: ""
    });
    setPhase("feedback");
  }

  function submitExerciseFeedback() {
    if (!currentFeedback) return;
    setFeedbackRows((prev) => [...prev, currentFeedback]);
    if (currentIndex < totalExercises - 1) {
      setPhase("rest");
    } else {
      setPhase("cooldown");
    }
  }

  const handleRestComplete = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setPhase("exercise");
  }, []);

  async function finishWorkout() {
    if (feedbackRows.length === 0) {
      setPhase("done");
      return;
    }
    setSavingFeedback(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          feedback: feedbackRows
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Fehler");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSavingFeedback(false);
      setPhase("done");
    }
  }

  /* ═════════════ OVERVIEW ═════════════ */
  if (phase === "overview") {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#0a0f1a]">
        <header className="px-4 pt-4 pb-2">
          <div className="mx-auto max-w-lg flex items-center justify-between">
            <button type="button" onClick={onExit} className="btn-ghost -ml-2">
              ← Zurück
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PHASE_COLORS[session.phase]} bg-white/5`}
              >
                {PHASE_LABELS[session.phase as keyof typeof PHASE_LABELS]}
              </span>
              {session.deload && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-blue-400 bg-blue-400/10">
                  Deload
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="mx-auto max-w-lg">
            <h1 className="text-2xl font-bold mb-1">Heutiges Workout</h1>
            <p className="text-sm text-slate-400 mb-6">
              {totalExercises} Übungen · Woche {session.blockWeek} · Ziel-RPE{" "}
              {session.targetRpe.toFixed(1)}
            </p>

            <div className="space-y-2.5">
              {session.items.map((item, i) => (
                <div
                  key={item.id}
                  className="glass p-4 flex items-center gap-4 animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{item.exercise.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.sets} × {item.repsMin}-{item.repsMax} Wdh ·{" "}
                      {item.exercise.primaryMuscle}
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 hidden sm:block">
                    {MOVEMENT_LABELS[
                      item.exercise.movement as keyof typeof MOVEMENT_LABELS
                    ] ?? item.exercise.movement}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0a0f1a]/90 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              className="btn-primary w-full text-lg py-4"
              onClick={startWorkout}
            >
              Los geht&apos;s! 🏋️
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════ EXERCISE ═════════════ */
  if (phase === "exercise" && currentItem) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#0a0f1a]">
        <header className="px-4 pt-4 pb-2">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={onExit} className="btn-ghost text-sm -ml-2">
                ✕ Beenden
              </button>
              <span className="text-sm text-slate-400 font-mono tabular-nums">
                {formatTime(elapsedSec)}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${((currentIndex + 1) / totalExercises) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 text-center">
              Übung {currentIndex + 1} von {totalExercises}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-32 flex items-start justify-center">
          <div className="mx-auto max-w-lg w-full animate-fade-in" key={currentIndex}>
            {/* Exercise visual */}
            {currentItem.exercise.sketchUrl && (
              <div className="mb-5 rounded-2xl overflow-hidden bg-white/5 aspect-video flex items-center justify-center relative">
                <Image
                  src={currentItem.exercise.sketchUrl}
                  alt={currentItem.exercise.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              </div>
            )}

            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold">{currentItem.exercise.name}</h1>
              <p className="text-sm text-slate-400 mt-1">{currentItem.exercise.primaryMuscle}</p>
            </div>

            {/* Sets & Reps */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="glass p-4 text-center">
                <p className="text-3xl font-bold gradient-text">{currentItem.sets}</p>
                <p className="text-xs text-slate-500 mt-1">Sätze</p>
              </div>
              <div className="glass p-4 text-center">
                <p className="text-3xl font-bold gradient-text">
                  {currentItem.repsMin === currentItem.repsMax
                    ? currentItem.repsMax
                    : `${currentItem.repsMin}-${currentItem.repsMax}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">Wdh</p>
              </div>
              <div className="glass p-4 text-center">
                <p className="text-3xl font-bold gradient-text">{currentItem.restSec}</p>
                <p className="text-xs text-slate-500 mt-1">Sek Pause</p>
              </div>
            </div>

            {/* Science note */}
            <div className="glass p-3 mb-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                💡 {currentItem.exercise.scienceNote}
              </p>
            </div>

            {/* Video player */}
            {currentItem.exercise.videoUrl && (
              <YouTubePlayer videoUrl={currentItem.exercise.videoUrl} />
            )}
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0a0f1a]/90 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
          <div className="mx-auto max-w-lg">
            <button type="button" className="btn-primary w-full py-4" onClick={finishExercise}>
              Übung abgeschlossen ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════ FEEDBACK ═════════════ */
  if (phase === "feedback" && currentFeedback && currentItem) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#0a0f1a]">
        <header className="px-4 pt-4 pb-2">
          <div className="mx-auto max-w-lg text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Feedback für</p>
            <h2 className="text-lg font-bold mt-1">{currentItem.exercise.name}</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
            {/* Difficulty selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Wie war&apos;s?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`selection-card py-5 ${currentFeedback.difficulty === d ? "active" : ""}`}
                    onClick={() => setCurrentFeedback({ ...currentFeedback, difficulty: d })}
                  >
                    <span className="text-3xl">{DIFFICULTY_EMOJI[d]}</span>
                    <p className="mt-1.5 text-xs font-medium">{DIFFICULTY_LABELS[d]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* RPE slider */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                RPE (Anstrengung):{" "}
                <span className="text-brand-400">{currentFeedback.avgRpe}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={currentFeedback.avgRpe}
                onChange={(e) =>
                  setCurrentFeedback({ ...currentFeedback, avgRpe: Number(e.target.value) })
                }
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 (leicht)</span>
                <span>10 (maximal)</span>
              </div>
            </div>

            {/* Completed sets/reps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Sätze geschafft
                </label>
                <input
                  className="input-modern text-center text-xl font-bold"
                  type="number"
                  min={0}
                  max={10}
                  value={currentFeedback.completedSets}
                  onChange={(e) =>
                    setCurrentFeedback({
                      ...currentFeedback,
                      completedSets: Number(e.target.value)
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Wdh pro Satz
                </label>
                <input
                  className="input-modern text-center text-xl font-bold"
                  type="number"
                  min={0}
                  max={200}
                  value={currentFeedback.completedReps}
                  onChange={(e) =>
                    setCurrentFeedback({
                      ...currentFeedback,
                      completedReps: Number(e.target.value)
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0a0f1a]/90 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              className="btn-primary w-full py-4"
              onClick={submitExerciseFeedback}
            >
              {currentIndex < totalExercises - 1 ? "Weiter →" : "Zum Cooldown →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════ REST ═════════════ */
  if (phase === "rest") {
    const nextItem = session.items[currentIndex + 1];
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#0a0f1a]">
        <div className="mx-auto max-w-lg text-center animate-fade-in">
          <h2 className="text-lg font-semibold text-slate-300 mb-8">Kurze Pause</h2>
          <RestTimer seconds={45} onComplete={handleRestComplete} />
          {nextItem && (
            <div className="mt-8 glass p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Nächste Übung
              </p>
              <p className="font-semibold">{nextItem.exercise.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {nextItem.sets} × {nextItem.repsMin}-{nextItem.repsMax} Wdh
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═════════════ COOLDOWN ═════════════ */
  if (phase === "cooldown") {
    const step = COOLDOWN_STEPS[cooldownStep];
    if (!step) {
      finishWorkout();
      return null;
    }
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#0a0f1a]">
        <header className="px-4 pt-4 pb-2">
          <div className="mx-auto max-w-lg">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${((cooldownStep + 1) / COOLDOWN_STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 text-center">
              Cooldown · {cooldownStep + 1}/{COOLDOWN_STEPS.length}
            </p>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 pb-32">
          <div className="mx-auto max-w-lg text-center animate-fade-in" key={cooldownStep}>
            <span className="text-5xl mb-5 block">{step.emoji}</span>
            <h2 className="text-2xl font-bold mb-2">{step.name}</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">{step.description}</p>
            <RestTimer
              key={`cooldown-${cooldownStep}`}
              seconds={step.duration}
              onComplete={() => {
                if (cooldownStep < COOLDOWN_STEPS.length - 1) {
                  setCooldownStep((s) => s + 1);
                } else {
                  finishWorkout();
                }
              }}
            />
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-[#0a0f1a]/90 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={finishWorkout}
              disabled={savingFeedback}
            >
              {savingFeedback ? "Speichere..." : "Cooldown überspringen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════ DONE ═════════════ */
  if (phase === "done") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[#0a0f1a]">
        <div className="mx-auto max-w-lg text-center animate-slide-up w-full">
          <span className="text-6xl mb-5 block">🎉</span>
          <h1 className="text-3xl font-bold mb-2">Geschafft!</h1>
          <p className="text-slate-400 mb-8">Starkes Workout! Weiter so.</p>

          <div className="glass p-5 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold gradient-text">{totalExercises}</p>
                <p className="text-xs text-slate-500 mt-1">Übungen</p>
              </div>
              <div>
                <p className="text-2xl font-bold gradient-text">{formatTime(elapsedSec)}</p>
                <p className="text-xs text-slate-500 mt-1">Dauer</p>
              </div>
              <div>
                <p className="text-2xl font-bold gradient-text">
                  {PHASE_LABELS[session.phase as keyof typeof PHASE_LABELS]}
                </p>
                <p className="text-xs text-slate-500 mt-1">Phase</p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <button type="button" className="btn-primary w-full py-4 text-lg" onClick={onComplete}>
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
