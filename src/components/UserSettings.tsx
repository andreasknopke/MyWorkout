"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { EquipmentType, Goal, Limitation } from "@prisma/client";
import {
  GOAL_LABELS,
  GOAL_EMOJI,
  GOAL_DESC,
  EQUIPMENT_LABELS,
  EQUIPMENT_EMOJI,
  LIMITATION_LABELS,
  MOVEMENT_LABELS,
  GENDER_OPTIONS
} from "@/lib/labels";
import { EQUIPMENT_OPTIONS, LIMITATION_OPTIONS } from "@/lib/types";
import { YouTubePlayerPanel } from "./YouTubePlayer";

/* ── Types ── */
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

type ExerciseInfo = {
  id: string;
  slug: string;
  name: string;
  description: string;
  movement: string;
  primaryMuscle: string;
  videoUrl?: string | null;
  equipment: string[];
  strainScore: number;
};

type Props = {
  user: UserProfile;
  onBack: () => void;
  onUserUpdated: (user: UserProfile) => void;
};

const GOALS: Goal[] = ["HYPERTROPHY", "STRENGTH", "ENDURANCE"];

const MOVEMENT_EMOJI: Record<string, string> = {
  PUSH: "🫸",
  PULL: "🫷",
  LEGS: "🦵",
  CORE: "🧘",
  CONDITIONING: "🏃",
  STRETCHING: "🧘‍♀️"
};

type SettingsTab = "profile" | "exercises";

export default function UserSettings({ user, onBack, onUserUpdated }: Props) {
  const [tab, setTab] = useState<SettingsTab>("exercises");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Profile state
  const [goal, setGoal] = useState<Goal>(user.goal);
  const [age, setAge] = useState(user.age ?? 30);
  const [gender, setGender] = useState(user.gender ?? "");
  const [durationMin, setDurationMin] = useState(user.durationMin);
  const [trainingDays, setTrainingDays] = useState(user.trainingDaysPerWeek);
  const [equipment, setEquipment] = useState<EquipmentType[]>(
    user.equipment.map((e) => e.equipment)
  );
  const [limitations, setLimitations] = useState<Limitation[]>(
    user.limitations.map((l) => l.limitation)
  );

  // Exercise state
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [excludedSlugs, setExcludedSlugs] = useState<Set<string>>(
    new Set(user.excludedExercises)
  );
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [filterMovement, setFilterMovement] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  async function fetchExercises() {
    try {
      setExercisesLoading(true);
      const res = await fetch("/api/exercises");
      const data = await res.json();
      if (data.ok) {
        setExercises(data.exercises as ExerciseInfo[]);
      }
    } catch {
      // ignore
    } finally {
      setExercisesLoading(false);
    }
  }

  function toggleEquipment(item: EquipmentType) {
    setHasChanges(true);
    setEquipment((prev) => {
      if (prev.includes(item)) {
        const next = prev.filter((e) => e !== item);
        return next.length > 0 ? next : ["BODYWEIGHT" as EquipmentType];
      }
      return [...prev, item];
    });
  }

  function toggleLimitation(item: Limitation) {
    setHasChanges(true);
    setLimitations((prev) =>
      prev.includes(item) ? prev.filter((l) => l !== item) : [...prev, item]
    );
  }

  function toggleExclusion(slug: string) {
    setHasChanges(true);
    setExcludedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const markChanged = useCallback(() => setHasChanges(true), []);

  // Handle video URL update (saved directly per exercise, not part of user profile)
  const handleVideoUrlChanged = useCallback((exerciseId: string, slug: string, videoUrl: string | null) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, videoUrl } : ex))
    );
  }, []);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    let list = exercises;
    if (filterMovement !== "ALL") {
      list = list.filter((e) => e.movement === filterMovement);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primaryMuscle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, filterMovement, searchTerm]);

  // Stats
  const includedCount = exercises.length - excludedSlugs.size;
  const withVideoCount = exercises.filter((e) => e.videoUrl).length;
  const movements = useMemo(
    () => [...new Set(exercises.map((e) => e.movement))].sort(),
    [exercises]
  );

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          age,
          gender: gender || undefined,
          durationMin,
          trainingDaysPerWeek: trainingDays,
          equipment,
          limitations,
          excludedExercises: Array.from(excludedSlugs)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Fehler");
      setSaveMsg("✅ Gespeichert!");
      setHasChanges(false);
      onUserUpdated(data.user as UserProfile);
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(`❌ ${err instanceof Error ? err.message : "Fehler"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0f1a]">
      {/* Header */}
      <header className="px-4 pt-5 pb-2">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onBack} className="btn-ghost -ml-2">
              ← Zurück
            </button>
            <h1 className="text-lg font-bold">⚙️ Einstellungen</h1>
            <div className="w-20" /> {/* spacer */}
          </div>

          {/* Tab bar */}
          <div className="mt-3 flex gap-1 rounded-xl bg-white/5 p-1">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === "exercises"
                  ? "bg-brand-500/20 text-brand-300"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setTab("exercises")}
            >
              🏋️ Übungen
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === "profile"
                  ? "bg-brand-500/20 text-brand-300"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setTab("profile")}
            >
              👤 Profil
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="mx-auto max-w-lg animate-fade-in" key={tab}>
          {tab === "exercises" ? (
            <ExercisesTab
              exercises={filteredExercises}
              allExercises={exercises}
              excludedSlugs={excludedSlugs}
              toggleExclusion={toggleExclusion}
              loading={exercisesLoading}
              filterMovement={filterMovement}
              setFilterMovement={setFilterMovement}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              movements={movements}
              includedCount={includedCount}
              withVideoCount={withVideoCount}
              totalCount={exercises.length}
              onVideoUrlChanged={handleVideoUrlChanged}
            />
          ) : (
            <ProfileTab
              goal={goal}
              setGoal={(g) => { setGoal(g); markChanged(); }}
              age={age}
              setAge={(a) => { setAge(a); markChanged(); }}
              gender={gender}
              setGender={(g) => { setGender(g); markChanged(); }}
              durationMin={durationMin}
              setDurationMin={(d) => { setDurationMin(d); markChanged(); }}
              trainingDays={trainingDays}
              setTrainingDays={(d) => { setTrainingDays(d); markChanged(); }}
              equipment={equipment}
              toggleEquipment={toggleEquipment}
              limitations={limitations}
              toggleLimitation={toggleLimitation}
            />
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
          <div className="mx-auto max-w-lg px-4 pb-4">
            <div className="glass-strong p-3 flex items-center gap-3 animate-slide-up">
              <p className="flex-1 text-sm text-slate-300">
                {saveMsg ?? "Ungespeicherte Änderungen"}
              </p>
              <button
                type="button"
                className="btn-primary text-sm px-5 py-2.5"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Speichere…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save message when no changes */}
      {!hasChanges && saveMsg && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="mx-auto max-w-lg glass-strong p-3 text-center text-sm animate-fade-in">
            {saveMsg}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Exercises Tab
   ════════════════════════════════════════════════════════════ */
function ExercisesTab({
  exercises,
  allExercises,
  excludedSlugs,
  toggleExclusion,
  loading,
  filterMovement,
  setFilterMovement,
  searchTerm,
  setSearchTerm,
  movements,
  includedCount,
  withVideoCount,
  totalCount,
  onVideoUrlChanged
}: {
  exercises: ExerciseInfo[];
  allExercises: ExerciseInfo[];
  excludedSlugs: Set<string>;
  toggleExclusion: (slug: string) => void;
  loading: boolean;
  filterMovement: string;
  setFilterMovement: (m: string) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  movements: string[];
  includedCount: number;
  withVideoCount: number;
  totalCount: number;
  onVideoUrlChanged: (exerciseId: string, slug: string, videoUrl: string | null) => void;
}) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <span className="text-3xl block mb-2">🏋️</span>
        <p className="text-slate-400">Lade Übungen…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass p-2.5 text-center">
          <p className="text-lg font-bold gradient-text">{includedCount}</p>
          <p className="text-[10px] text-slate-500">Aktiv</p>
        </div>
        <div className="glass p-2.5 text-center">
          <p className="text-lg font-bold text-red-400">{totalCount - includedCount}</p>
          <p className="text-[10px] text-slate-500">Ausgeschlossen</p>
        </div>
        <div className="glass p-2.5 text-center">
          <p className="text-lg font-bold text-blue-400">{withVideoCount}</p>
          <p className="text-[10px] text-slate-500">Mit Video</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          type="text"
          placeholder="Übung suchen…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-modern pl-10 text-sm"
        />
      </div>

      {/* Movement filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`toggle-pill text-xs ${filterMovement === "ALL" ? "active" : ""}`}
          onClick={() => setFilterMovement("ALL")}
        >
          Alle
        </button>
        {movements.map((m) => (
          <button
            key={m}
            type="button"
            className={`toggle-pill text-xs ${filterMovement === m ? "active" : ""}`}
            onClick={() => setFilterMovement(m)}
          >
            {MOVEMENT_EMOJI[m] ?? "📌"}{" "}
            {MOVEMENT_LABELS[m as keyof typeof MOVEMENT_LABELS] ?? m}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-ghost text-xs flex-1"
          onClick={() => {
            // Include all visible
            exercises.forEach((e) => {
              if (excludedSlugs.has(e.slug)) toggleExclusion(e.slug);
            });
          }}
        >
          ✅ Alle einschließen
        </button>
        <button
          type="button"
          className="btn-ghost text-xs flex-1"
          onClick={() => {
            // Exclude all visible
            exercises.forEach((e) => {
              if (!excludedSlugs.has(e.slug)) toggleExclusion(e.slug);
            });
          }}
        >
          ❌ Alle ausschließen
        </button>
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises.map((ex) => {
          const isExcluded = excludedSlugs.has(ex.slug);
          return (
            <ExerciseCard
              key={ex.slug}
              exercise={ex}
              isExcluded={isExcluded}
              onToggleExclusion={() => toggleExclusion(ex.slug)}
              onVideoUrlChanged={onVideoUrlChanged}
            />
          );
        })}

        {exercises.length === 0 && (
          <div className="py-8 text-center text-slate-500 text-sm">
            Keine Übungen gefunden
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Exercise Card with inline video URL editing
   ════════════════════════════════════════════════════════════ */
function ExerciseCard({
  exercise: ex,
  isExcluded,
  onToggleExclusion,
  onVideoUrlChanged
}: {
  exercise: ExerciseInfo;
  isExcluded: boolean;
  onToggleExclusion: () => void;
  onVideoUrlChanged: (exerciseId: string, slug: string, videoUrl: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingUrl, setEditingUrl] = useState(ex.videoUrl ?? "");
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlMsg, setUrlMsg] = useState<string | null>(null);

  const urlChanged = (editingUrl || "") !== (ex.videoUrl || "");

  async function handleSaveUrl() {
    setSavingUrl(true);
    setUrlMsg(null);
    try {
      const newUrl = editingUrl.trim() || null;
      const res = await fetch(`/api/exercises/${ex.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: newUrl })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Fehler");
      onVideoUrlChanged(ex.id, ex.slug, newUrl);
      setUrlMsg("✅");
      setTimeout(() => setUrlMsg(null), 1500);
    } catch (err) {
      setUrlMsg(`❌ ${err instanceof Error ? err.message : "Fehler"}`);
    } finally {
      setSavingUrl(false);
    }
  }

  function handleRemoveUrl() {
    setEditingUrl("");
  }

  return (
    <div
      className={`glass p-3 transition-all ${
        isExcluded ? "opacity-50 border-red-500/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle inclusion */}
        <button
          type="button"
          onClick={onToggleExclusion}
          className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isExcluded
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-brand-500/50 bg-brand-500/10 text-brand-400"
          }`}
          title={isExcluded ? "Einschließen" : "Ausschließen"}
        >
          {isExcluded ? "✕" : "✓"}
        </button>

        {/* Exercise info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-sm ${
                isExcluded ? "line-through text-slate-500" : ""
              }`}
            >
              {ex.name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
              {MOVEMENT_EMOJI[ex.movement] ?? "📌"}{" "}
              {MOVEMENT_LABELS[ex.movement as keyof typeof MOVEMENT_LABELS] ?? ex.movement}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">{ex.primaryMuscle}</p>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{ex.description}</p>

          {/* Equipment tags */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {ex.equipment.map((eq: string) => (
              <span
                key={eq}
                className="text-[10px] rounded-md bg-white/5 px-1.5 py-0.5 text-slate-500"
              >
                {EQUIPMENT_EMOJI[eq as EquipmentType] ?? "🔧"}{" "}
                {EQUIPMENT_LABELS[eq as EquipmentType] ?? eq}
              </span>
            ))}
            <span className="text-[10px] rounded-md bg-white/5 px-1.5 py-0.5 text-slate-500">
              {"⚡".repeat(ex.strainScore)} Belastung {ex.strainScore}/5
            </span>
          </div>
        </div>

        {/* Video indicator + expand */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {ex.videoUrl ? (
            <div
              className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20
                flex items-center justify-center text-lg"
              title="Video verfügbar"
            >
              🎬
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10
                flex items-center justify-center text-lg opacity-30"
              title="Kein Video"
            >
              🎬
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setExpanded(!expanded);
              setEditingUrl(ex.videoUrl ?? "");
              setUrlMsg(null);
            }}
            className="text-[10px] text-slate-500 hover:text-brand-400 transition-colors"
            title="Video-URL bearbeiten"
          >
            {expanded ? "▲" : "✏️"}
          </button>
        </div>
      </div>

      {/* Expanded: Video URL editor */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/5 animate-fade-in">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">
            YouTube Video-URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={editingUrl}
              onChange={(e) => setEditingUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input-modern text-xs flex-1 py-2"
            />
            {editingUrl && (
              <button
                type="button"
                onClick={handleRemoveUrl}
                className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20
                  flex items-center justify-center text-sm
                  hover:bg-red-500/20 transition-all flex-shrink-0"
                title="URL entfernen"
              >
                🗑️
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleSaveUrl}
              disabled={!urlChanged || savingUrl}
              className="btn-primary text-xs px-4 py-1.5 disabled:opacity-30"
            >
              {savingUrl ? "…" : "💾 Speichern"}
            </button>

            {editingUrl && (
              <a
                href={editingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs px-3 py-1.5"
              >
                🔗 Testen
              </a>
            )}

            {urlMsg && (
              <span className="text-xs">{urlMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* Inline video player – always visible */}
      {ex.videoUrl && (
        <YouTubePlayerPanel videoUrl={ex.videoUrl} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Profile Tab
   ════════════════════════════════════════════════════════════ */
function ProfileTab({
  goal,
  setGoal,
  age,
  setAge,
  gender,
  setGender,
  durationMin,
  setDurationMin,
  trainingDays,
  setTrainingDays,
  equipment,
  toggleEquipment,
  limitations,
  toggleLimitation
}: {
  goal: Goal;
  setGoal: (g: Goal) => void;
  age: number;
  setAge: (a: number) => void;
  gender: string;
  setGender: (g: string) => void;
  durationMin: number;
  setDurationMin: (d: number) => void;
  trainingDays: number;
  setTrainingDays: (d: number) => void;
  equipment: EquipmentType[];
  toggleEquipment: (e: EquipmentType) => void;
  limitations: Limitation[];
  toggleLimitation: (l: Limitation) => void;
}) {
  return (
    <div className="space-y-5 mt-3">
      {/* Goal */}
      <section className="glass p-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          🎯 Trainingsziel
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              className={`selection-card py-3 ${goal === g ? "active" : ""}`}
              onClick={() => setGoal(g)}
            >
              <span className="text-2xl block mb-1">{GOAL_EMOJI[g]}</span>
              <span className="text-xs font-medium">{GOAL_LABELS[g]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Personal */}
      <section className="glass p-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          👤 Persönliches
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Alter</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              min={10}
              max={120}
              className="input-modern text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Geschlecht</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="input-modern text-sm"
            >
              <option value="">—</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Training schedule */}
      <section className="glass p-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          📅 Trainingsplan
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Trainingstage/Woche</span>
              <span className="font-bold gradient-text">{trainingDays}×</span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={trainingDays}
              onChange={(e) => setTrainingDays(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Dauer pro Session</span>
              <span className="font-bold gradient-text">{durationMin} Min</span>
            </div>
            <input
              type="range"
              min={15}
              max={90}
              step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="glass p-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          🏋️ Verfügbares Equipment
        </h2>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq}
              type="button"
              className={`toggle-pill text-xs ${equipment.includes(eq) ? "active" : ""}`}
              onClick={() => toggleEquipment(eq)}
            >
              {EQUIPMENT_EMOJI[eq]} {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </div>
      </section>

      {/* Limitations */}
      <section className="glass p-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          ⚕️ Einschränkungen
        </h2>
        <div className="flex flex-wrap gap-2">
          {LIMITATION_OPTIONS.map((lim) => (
            <button
              key={lim}
              type="button"
              className={`toggle-pill text-xs ${limitations.includes(lim) ? "active" : ""}`}
              onClick={() => toggleLimitation(lim)}
            >
              {LIMITATION_LABELS[lim]}
            </button>
          ))}
        </div>
        {limitations.length === 0 && (
          <p className="text-xs text-slate-600 mt-2">
            Keine Einschränkungen — alle Übungen erlaubt
          </p>
        )}
      </section>
    </div>
  );
}
