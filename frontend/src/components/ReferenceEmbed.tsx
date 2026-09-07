function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.replace(/^www\./, "") === "youtube.com" || u.hostname.replace(/^www\./, "") === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

// Renders a responsive YouTube embed for a recognized youtube.com/youtu.be
// URL; any other reference URL (a plain audio file, a random site) falls
// back to the external link that was there before.
export default function ReferenceEmbed({ url }: { url: string }) {
  const videoId = getYouTubeId(url);

  if (!videoId) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-cyan underline hover:text-magenta">
        Reference recording
      </a>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-line" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="Reference recording"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
