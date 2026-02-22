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
   Inline YouTube Player – always visible
   (user must press play on the iframe itself)
   ──────────────────────────────────────────── */
export default function YouTubePlayer({
  videoUrl,
}: {
  videoUrl: string;
}) {
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    // fallback: external link if we can't parse
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block glass p-3 text-center text-sm text-brand-400 hover:text-brand-300 transition-colors"
        title="Video ansehen (extern)"
      >
        🎬 Technikvideo ansehen
      </a>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
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

/* ────────────────────────────────────────────
   Compact panel for ExerciseCard – always visible
   ──────────────────────────────────────────── */
export function YouTubePlayerPanel({
  videoUrl,
}: {
  videoUrl: string;
}) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;

  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
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
