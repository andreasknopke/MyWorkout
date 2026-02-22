"use client";

import { useMemo } from "react";
import type { Goal } from "@prisma/client";
import { GOAL_LABELS, GOAL_EMOJI } from "@/lib/labels";
import { generateWeeklySchedule, getTodayFocus, isTodayTrainingDay } from "@/lib/schedule";

type UserProfile = {
  id: string;
  name: string;
  goal: Goal;
  age?: number | null;
  gender?: string | null;
  durationMin: number;
  trainingDaysPerWeek: number;
  cycleLengthWeeks: number;
};

type Props = {
  user: UserProfile;
  users: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onStartWorkout: () => void;
  onNewProfile: () => void;
  onSettings: () => void;
};

export default function Dashboard({
  user,
  users,
  onSwitchUser,
  onStartWorkout,
  onNewProfile,
  onSettings
}: Props) {
  const schedule = useMemo(
    () => generateWeeklySchedule(user.trainingDaysPerWeek),
    [user.trainingDaysPerWeek]
  );
  const todayIsTraining = isTodayTrainingDay(user.trainingDaysPerWeek);
  const todayFocus = getTodayFocus(user.trainingDaysPerWeek);

  const dateStr = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0f1a]">
      {/* Header */}
      <header className="px-4 pt-5 pb-2">
        <div className="mx-auto max-w-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{dateStr}</p>
              <h1 className="text-2xl font-bold mt-1">
                Hallo, <span className="gradient-text">{user.name}</span>! 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {users.length > 1 && (
                <select
                  className="rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none"
                  value={user.id}
                  onChange={(e) => onSwitchUser(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={onNewProfile}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
                title="Neues Profil"
              >
                +
              </button>
              <button
                type="button"
                onClick={onSettings}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
                title="Einstellungen"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Goal & info badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 text-sm text-brand-300">
              {GOAL_EMOJI[user.goal]} {GOAL_LABELS[user.goal]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
              {user.trainingDaysPerWeek}×/Woche
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
              {user.durationMin ?? 40} Min
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 pt-3">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Weekly Schedule */}
          <section className="glass p-4 animate-fade-in">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Wochenplan
            </h2>
            <div className="grid grid-cols-7 gap-1.5">
              {schedule.map((day) => (
                <div
                  key={day.dayIndex}
                  className={`rounded-xl p-2 text-center transition-all ${
                    day.isToday
                      ? day.isTrainingDay
                        ? "bg-brand-500/20 border border-brand-500/30 ring-2 ring-brand-500/20"
                        : "bg-white/10 border border-white/20"
                      : day.isTrainingDay
                        ? "bg-white/5"
                        : ""
                  }`}
                >
                  <p
                    className={`text-[11px] font-semibold ${day.isToday ? "text-brand-400" : "text-slate-500"}`}
                  >
                    {day.label}
                  </p>
                  {day.isTrainingDay ? (
                    <>
                      <p className="text-base mt-0.5">🏋️</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate leading-tight">
                        {day.focus}
                      </p>
                    </>
                  ) : (
                    <p className="text-base mt-0.5 opacity-20">—</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Today's Workout Card */}
          <section
            className="glass p-5 animate-slide-up"
            style={{ animationDelay: "0.1s", animationFillMode: "both" }}
          >
            {todayIsTraining ? (
              <>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <h2 className="text-lg font-bold">Heute: {todayFocus}</h2>
                    <p className="text-xs text-slate-400">
                      {user.durationMin ?? 40} Min · {GOAL_LABELS[user.goal]}
                    </p>
                  </div>
                </div>
                <button type="button" className="btn-primary w-full text-lg py-4" onClick={onStartWorkout}>
                  Workout starten 💪
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-3xl">😌</span>
                  <div>
                    <h2 className="text-lg font-bold">Ruhetag</h2>
                    <p className="text-xs text-slate-400">
                      Regeneration ist genauso wichtig wie Training!
                    </p>
                  </div>
                </div>
                <button type="button" className="btn-secondary w-full" onClick={onStartWorkout}>
                  Trotzdem trainieren
                </button>
              </>
            )}
          </section>

          {/* Quick Stats */}
          <section
            className="grid grid-cols-3 gap-2 animate-slide-up"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <div className="glass p-3 text-center">
              <p className="text-2xl font-bold gradient-text">{user.trainingDaysPerWeek}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tage/Woche</p>
            </div>
            <div className="glass p-3 text-center">
              <p className="text-2xl font-bold gradient-text">{user.durationMin ?? 40}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Min/Session</p>
            </div>
            <div className="glass p-3 text-center">
              <p className="text-2xl font-bold gradient-text">{user.cycleLengthWeeks}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Wochen/Zyklus</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
