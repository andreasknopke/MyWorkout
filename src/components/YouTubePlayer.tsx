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
      const v = u.searchParams.get("v");
      if (v) return v;
      const match = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }
  } catch {
    // not a valid URL
  }
  return null;
}

/** Check if URL points to a GIF / image file */
function isImageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(gif|png|jpg|jpeg|webp|avif)$/.test(path);
  } catch {
    return false;
  }
}

/* ────────────────────────────────────────────
   Media embed – shows YouTube iframe OR GIF/image
   ──────────────────────────────────────────── */
function MediaEmbed({ url, className }: { url: string; className?: string }) {
  // GIF / image
  if (isImageUrl(url)) {
    return (
      <div className={`rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Übung"
          className="w-full h-auto"
          loading="lazy"
        />
      </div>
    );
  }

  // YouTube
  const videoId = extractVideoId(url);
  if (videoId) {
    return (
      <div className={`rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${className ?? ""}`}>
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

  // Fallback: external link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block glass p-3 text-center text-sm text-brand-400 hover:text-brand-300 transition-colors"
      title="Video ansehen (extern)"
    >
      🎬 Technikvideo ansehen
    </a>
  );
}

/* ────────────────────────────────────────────
   Full-size player (WorkoutMode)
   ──────────────────────────────────────────── */
export default function YouTubePlayer({ videoUrl }: { videoUrl: string }) {
  return <MediaEmbed url={videoUrl} />;
}

/* ────────────────────────────────────────────
   Compact panel for ExerciseCard / Onboarding
   ──────────────────────────────────────────── */
export function YouTubePlayerPanel({ videoUrl }: { videoUrl: string }) {
  return <MediaEmbed url={videoUrl} className="mt-2" />;
}
