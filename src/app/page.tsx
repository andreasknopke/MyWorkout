"use client";

import { useEffect, useState, useCallback } from "react";
import type { EquipmentType, Goal, Limitation } from "@prisma/client";
import OnboardingWizard from "@/components/OnboardingWizard";
import Dashboard from "@/components/Dashboard";
import WorkoutMode from "@/components/WorkoutMode";

type UserProfile = {
  id: string;
  name: string;
  goal: Goal;
  age?: number | null;
  gender?: string | null;
  durationMin: number;
  trainingDaysPerWeek: number;
  cycleLengthWeeks: number;
  equipment: Array<{ equipment: EquipmentType }>;
  limitations: Array<{ limitation: Limitation }>;
  excludedExercises: string[];
};

type GeneratedSession = {
  id: string;
  targetRpe: number;
  fatigueScore: number;
  deload: boolean;
  phase: "ACCUMULATION" | "INTENSIFICATION" | "DELOAD";
  blockWeek: number;
  items: Array<{
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
  }>;
};

type AppView = "loading" | "onboarding" | "dashboard" | "workout";

export default function Home() {
  const [view, setView] = useState<AppView>("loading");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeUser = users.find((u) => u.id === activeUserId) ?? null;

  /* ── Load users on mount ── */
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok || !data.ok) return;

      const fetched = data.users as UserProfile[];
      setUsers(fetched);

      const savedId =
        typeof window !== "undefined" ? localStorage.getItem("myworkout_active_user") : null;
      const matching = fetched.find((u) => u.id === savedId);

      if (fetched.length === 0) {
        setView("onboarding");
      } else {
        setActiveUserId(matching ? matching.id : fetched[0].id);
        setView("dashboard");
      }
    } catch {
      setView("onboarding");
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (activeUserId) {
      localStorage.setItem("myworkout_active_user", activeUserId);
    }
  }, [activeUserId]);

  /* ── Handlers ── */
  function handleOnboardingComplete(userId: string) {
    setActiveUserId(userId);
    loadUsers().then(() => setView("dashboard"));
  }

  function handleSwitchUser(userId: string) {
    setActiveUserId(userId);
    setSession(null);
  }

  async function handleStartWorkout() {
    if (!activeUser) return;
    setLoading(true);
    setError(null);
    try {
      const equipment = activeUser.equipment.map((e) => e.equipment);
      const limitations = activeUser.limitations.map((l) => l.limitation);
      const res = await fetch("/api/workouts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUser.id,
          goal: activeUser.goal,
          durationMin: activeUser.durationMin ?? 40,
          equipment,
          limitations
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Fehler");
      setSession(data.session as GeneratedSession);
      setView("workout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Generieren");
    } finally {
      setLoading(false);
    }
  }

  function handleWorkoutComplete() {
    setSession(null);
    setView("dashboard");
  }

  /* ── LOADING ── */
  if (view === "loading") {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center animate-fade-in">
          <span className="text-5xl block mb-4">🏋️</span>
          <p className="text-slate-400">Lade MyWorkout...</p>
        </div>
      </main>
    );
  }

  /* ── ONBOARDING ── */
  if (view === "onboarding") {
    return (
      <OnboardingWizard
        onComplete={handleOnboardingComplete}
        onCancel={users.length > 0 ? () => setView("dashboard") : undefined}
      />
    );
  }

  /* ── WORKOUT MODE ── */
  if (view === "workout" && session) {
    return (
      <WorkoutMode
        session={session}
        onComplete={handleWorkoutComplete}
        onExit={handleWorkoutComplete}
      />
    );
  }

  /* ── DASHBOARD ── */
  if (activeUser) {
    return (
      <>
        <Dashboard
          user={activeUser}
          users={users}
          onSwitchUser={handleSwitchUser}
          onStartWorkout={handleStartWorkout}
          onNewProfile={() => setView("onboarding")}
        />

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-strong p-8 text-center animate-fade-in">
              <span className="text-4xl block mb-3">⚡</span>
              <p className="font-semibold">Workout wird generiert...</p>
              <p className="text-sm text-slate-400 mt-1">Einen Moment bitte</p>
            </div>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <div className="mx-auto max-w-lg glass-strong p-4 flex items-center gap-3 animate-slide-up">
              <span>⚠️</span>
              <p className="text-sm flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
