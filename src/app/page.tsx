"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { DifficultyFeedback, EquipmentType, Goal, Limitation } from "@prisma/client";
import { EQUIPMENT_OPTIONS, LIMITATION_OPTIONS } from "@/lib/types";

type UserProfile = {
  id: string;
  name: string;
  goal: Goal;
  trainingDaysPerWeek: number;
  cycleLengthWeeks: number;
  equipment: Array<{ equipment: EquipmentType }>;
  limitations: Array<{ limitation: Limitation }>;
};

type FeedbackRow = {
  exerciseId: string;
  avgRpe: number;
  completedSets: number;
  completedReps: number;
  difficulty: DifficultyFeedback;
  notes: string;
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

const GOALS: Goal[] = ["HYPERTROPHY", "STRENGTH", "ENDURANCE"];
const DIFFICULTIES: DifficultyFeedback[] = ["TOO_EASY", "JUST_RIGHT", "TOO_HARD"];

export default function Home() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [goal, setGoal] = useState<Goal>("HYPERTROPHY");
  const [durationMin, setDurationMin] = useState(40);
  const [equipment, setEquipment] = useState<EquipmentType[]>(["BODYWEIGHT", "DUMBBELL"]);
  const [limitations, setLimitations] = useState<Limitation[]>([]);
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const equipmentSet = useMemo(() => new Set(equipment), [equipment]);
  const limitationSet = useMemo(() => new Set(limitations), [limitations]);

  const feedbackDefaults = useMemo<FeedbackRow[]>(
    () =>
      session
        ? session.items.map((item: GeneratedSession["items"][number]) => ({
            exerciseId: item.exercise.id,
            avgRpe: session.targetRpe,
            completedSets: item.sets,
            completedReps: item.repsMax,
            difficulty: "JUST_RIGHT" as DifficultyFeedback,
            notes: ""
          }))
        : [],
    [session]
  );
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);

  useEffect(() => {
    setFeedbackRows(feedbackDefaults);
    setFeedbackDone(false);
  }, [feedbackDefaults]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const response = await fetch("/api/users");
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setError(payload.message ?? "Profile konnten nicht geladen werden");
      return;
    }

    const fetched = payload.users as UserProfile[];
    setUsers(fetched);
    if (fetched.length > 0 && !activeUserId) {
      const first = fetched[0];
      setActiveUserId(first.id);
      setGoal(first.goal);
      setEquipment(first.equipment.map((x: { equipment: EquipmentType }) => x.equipment));
      setLimitations(first.limitations.map((x: { limitation: Limitation }) => x.limitation));
    }
  }

  async function createProfile() {
    if (newName.trim().length < 2) {
      setError("Bitte Namen mit mindestens 2 Zeichen eingeben.");
      return;
    }

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        goal,
        trainingDaysPerWeek: 3,
        cycleLengthWeeks: 6,
        equipment,
        limitations
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setError(payload.message ?? "Profil konnte nicht erstellt werden");
      return;
    }

    setNewName("");
    await loadUsers();
    setActiveUserId(payload.user.id as string);
  }

  async function generateWorkout() {
    setLoading(true);
    setError(null);
    try {
      await fetch(`/api/users/${activeUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, equipment, limitations })
      });

      const response = await fetch("/api/workouts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, goal, durationMin, equipment, limitations })
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Workout konnte nicht erstellt werden");
      }

      setSession(payload.session as GeneratedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Generieren");
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback() {
    if (!session || feedbackRows.length === 0) return;

    setSavingFeedback(true);
    setError(null);
    try {
      const response = await fetch("/api/workouts/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          feedback: feedbackRows
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Feedback konnte nicht gespeichert werden");
      }
      setFeedbackDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Feedback");
    } finally {
      setSavingFeedback(false);
    }
  }

  function onSelectUser(userId: string) {
    setActiveUserId(userId);
    const user = users.find((entry: UserProfile) => entry.id === userId);
    if (!user) return;
    setGoal(user.goal);
    setEquipment(user.equipment.map((x: { equipment: EquipmentType }) => x.equipment));
    setLimitations(user.limitations.map((x: { limitation: Limitation }) => x.limitation));
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6">
      <h1 className="mb-2 text-3xl font-bold">MyWorkout Trainer</h1>
      <p className="mb-6 text-slate-300">Adaptive Family-Workouts mit RPE-Feedback, Periodisierung und Equipment-Filter.</p>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <label className="label">Profil</label>
          <select className="input" value={activeUserId} onChange={(e: ChangeEvent<HTMLSelectElement>) => onSelectUser(e.target.value)}>
            {users.map((user: UserProfile) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <div className="mt-3 flex gap-2">
            <input
              className="input"
              placeholder="Neues Familienprofil"
              value={newName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            />
            <button className="button" onClick={createProfile} type="button">
              +
            </button>
          </div>
        </div>

        <div className="card">
          <label className="label">Ziel</label>
          <select className="input" value={goal} onChange={(e: ChangeEvent<HTMLSelectElement>) => setGoal(e.target.value as Goal)}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <label className="label">Dauer (Minuten)</label>
          <input
            className="input"
            type="number"
            min={15}
            max={120}
            value={durationMin}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDurationMin(Number(e.target.value))}
          />
        </div>

        <div className="card">
          <p className="label">Equipment</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {EQUIPMENT_OPTIONS.map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={equipmentSet.has(item)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEquipment((prev: EquipmentType[]) => {
                      if (e.target.checked) {
                        return [...new Set([...prev, item])];
                      }
                      const next = prev.filter((x: EquipmentType) => x !== item);
                      return next.length > 0 ? next : ["BODYWEIGHT"];
                    });
                  }}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="label">Bewegungs-/Verletzungsfilter</p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {LIMITATION_OPTIONS.map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={limitationSet.has(item)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setLimitations((prev: Limitation[]) => {
                      if (e.target.checked) {
                        return [...new Set([...prev, item])];
                      }
                      return prev.filter((x: Limitation) => x !== item);
                    });
                  }}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-4">
        <button className="button" onClick={generateWorkout} disabled={loading || !activeUserId}>
          {loading ? "Erstelle Workout..." : "Workout generieren"}
        </button>
      </div>

      {error ? <p className="mt-4 text-red-400">{error}</p> : null}

      {session ? (
        <section className="mt-6 grid gap-4">
          <div className="card">
            <p>
              Ziel-RPE: <strong>{session.targetRpe.toFixed(1)}</strong> | Ermüdung: <strong>{session.fatigueScore.toFixed(2)}</strong> | Deload: <strong>{session.deload ? "Ja" : "Nein"}</strong> | Block-Woche: <strong>{session.blockWeek}</strong> | Phase: <strong>{session.phase}</strong>
            </p>
          </div>

          {session.items.map((item) => (
            <article key={item.id} className="card">
              <h2 className="text-lg font-semibold">{item.exercise.name}</h2>
              <p className="text-sm text-slate-400">
                {item.exercise.movement} · {item.exercise.primaryMuscle}
              </p>
              <p className="mt-2 text-sm">
                {item.sets} Sätze · {item.repsMin}-{item.repsMax} Wdh · Pause {item.restSec}s · Lastfaktor x{item.loadModifier.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-slate-300">Science: {item.exercise.scienceNote}</p>
              {item.exercise.videoUrl ? (
                <p className="mt-1 text-sm">
                  Technikvideo: <a className="text-brand-400 underline" href={item.exercise.videoUrl} target="_blank" rel="noreferrer">öffnen</a>
                </p>
              ) : item.exercise.sketchUrl ? (
                <div className="mt-2">
                  <p className="mb-2 text-sm text-slate-300">Skizze</p>
                  <img src={item.exercise.sketchUrl} alt={`${item.exercise.name} Skizze`} className="h-40 w-full rounded-lg object-cover" />
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Skizze/Video: Platzhalter (kann pro Übung ergänzt werden).</p>
              )}
            </article>
          ))}

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold">Feedback nach dem Workout</h3>
            <div className="grid gap-3">
              {feedbackRows.map((row, index) => {
                const exerciseName = session.items.find((item) => item.exercise.id === row.exerciseId)?.exercise.name ?? "Übung";
                return (
                  <div key={row.exerciseId} className="rounded-lg border border-slate-700 p-3">
                    <p className="mb-2 text-sm font-medium">{exerciseName}</p>
                    <div className="grid gap-2 md:grid-cols-4">
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        value={row.avgRpe}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const next = [...feedbackRows];
                          next[index].avgRpe = Number(e.target.value);
                          setFeedbackRows(next);
                        }}
                      />
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={10}
                        value={row.completedSets}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const next = [...feedbackRows];
                          next[index].completedSets = Number(e.target.value);
                          setFeedbackRows(next);
                        }}
                      />
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={200}
                        value={row.completedReps}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const next = [...feedbackRows];
                          next[index].completedReps = Number(e.target.value);
                          setFeedbackRows(next);
                        }}
                      />
                      <select
                        className="input"
                        value={row.difficulty}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                          const next = [...feedbackRows];
                          next[index].difficulty = e.target.value as DifficultyFeedback;
                          setFeedbackRows(next);
                        }}
                      >
                        {DIFFICULTIES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <button className="button" type="button" onClick={submitFeedback} disabled={savingFeedback || feedbackDone}>
                {savingFeedback ? "Speichern..." : feedbackDone ? "Feedback gespeichert" : "Feedback speichern"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
