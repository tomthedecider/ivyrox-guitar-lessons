import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

// Lazy playback: fetches the clip as a blob (through the authed API client,
// since a plain <audio src> can't carry our Bearer token) only once the
// user asks for it, then hands the browser an object URL.
export default function AudioPlayer({ assignmentId }: { assignmentId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const blob = await api.blob(`/assignments/${assignmentId}/recording`);
      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      setUrl(objectUrl);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (url) return <audio controls src={url} className="h-8 max-w-[220px]" />;

  return (
    <button
      type="button"
      onClick={load}
      disabled={loading}
      className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-chip hover:text-ink disabled:opacity-50"
    >
      {loading ? "Loading…" : error ? "Couldn't load — retry" : "▶ Play recording"}
    </button>
  );
}
