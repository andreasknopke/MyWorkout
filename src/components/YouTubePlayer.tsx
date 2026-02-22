"use client";

import { useState } from "react";

/**
 * Extract YouTube video ID from various URL formats:
 *  - https://www.youtube.com/watch?v=XXXX
 *  - https://youtu.be/XXXX
 *  - https://www.youtube.com/embed/XXXX
 *  - https://www.youtube.com/shorts/XXXX
 */
function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      // /watch?v=ID
      const v = u.searchParams.get("v");
      if (v) return v;
      // /embed/ID or /shorts/ID
      const match = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }
  } catch {
    // not a valid URL
  }
  return null;
}

/* ────────────────────────────────────────────
   Inline YouTube Player (toggle open / close)
   ──────────────────────────────────────────── */
export default function YouTubePlayer({
  videoUrl,
  compact = false,
}: {
  videoUrl: string;
  /** compact = smaller button style for exercise cards */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    // fallback: external link if we can't parse
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={
          compact
            ? "w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-95"
            : "block glass p-3 text-center text-sm text-brand-400 hover:text-brand-300 transition-colors"
        }
        title="Video ansehen (extern)"
      >
        {compact ? "▶️" : "🎬 Technikvideo ansehen"}
      </a>
    );
  }

  if (compact) {
    /* ──── Compact mode: button + expandable player ──── */
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-all active:scale-95 ${
            open
              ? "bg-red-500/30 border-red-500/50 shadow-lg shadow-red-500/10"
              : "bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40"
          }`}
          title={open ? "Video schließen" : "Video ansehen"}
        >
          {open ? "⏹️" : "▶️"}
        </button>
      </div>
    );
  }

  /* ──── Full mode (WorkoutMode): toggle bar + iframe ──── */
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full glass p-3 text-center text-sm transition-all ${
          open
            ? "text-red-400 border-red-500/30"
            : "text-brand-400 hover:text-brand-300"
        }`}
      >
        {open ? "⏹️ Video schließen" : "🎬 Technikvideo ansehen"}
      </button>

      {open && (
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="Technikvideo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Compact expandable panel for ExerciseCard
   (renders outside the card row, below it)
   ──────────────────────────────────────────── */
export function YouTubePlayerPanel({
  videoUrl,
  open,
}: {
  videoUrl: string;
  open: boolean;
}) {
  const videoId = extractVideoId(videoUrl);
  if (!open || !videoId) return null;

  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="Technikvideo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
