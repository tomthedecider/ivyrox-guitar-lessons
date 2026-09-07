import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { LibrarySong, LibraryStatus } from "../../types";
import ReferenceEmbed from "../../components/ReferenceEmbed";

export default function StudentLibrary() {
  const [songs, setSongs] = useState<LibrarySong[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.get<LibrarySong[]>("/library");
    setSongs(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(songId: string) {
    await api.post(`/library/${songId}`);
    await load();
  }

  async function setStatus(songId: string, status: LibraryStatus) {
    await api.patch(`/library/${songId}`, { status });
    await load();
  }

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Song library</h1>
        <p className="text-sm text-muted">Browse and pick up anything you like — no approval needed.</p>
      </div>

      <ul className="space-y-3">
        {songs.map((song) => (
          <li key={song.id} className="rounded-xl border border-line bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{song.title}</h2>
                {song.artist && <p className="text-sm text-dim">{song.artist}</p>}
                <div className="mt-2 flex gap-3 text-sm">
                  {song.tabUrl && (
                    <a href={song.tabUrl} target="_blank" rel="noreferrer" className="text-cyan underline hover:text-magenta">
                      Tab / chord sheet
                    </a>
                  )}
                </div>
                {song.referenceUrl && <ReferenceEmbed url={song.referenceUrl} />}
                {song.tipsNote && <p className="mt-2 text-sm italic text-muted">Tip: {song.tipsNote}</p>}
              </div>

              <div className="shrink-0">
                {!song.progress ? (
                  <button
                    onClick={() => add(song.id)}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-chip hover:text-ink"
                  >
                    Add to my list
                  </button>
                ) : (
                  <div className="flex gap-1 rounded-lg border border-line p-0.5 text-sm">
                    <button
                      onClick={() => setStatus(song.id, "LEARNING")}
                      className={`rounded-md px-2 py-1 ${
                        song.progress.status === "LEARNING" ? "bg-violet-tint text-violet" : "text-dim"
                      }`}
                    >
                      Learning
                    </button>
                    <button
                      onClick={() => setStatus(song.id, "LEARNED")}
                      className={`rounded-md px-2 py-1 ${
                        song.progress.status === "LEARNED" ? "bg-gold-tint text-gold" : "text-dim"
                      }`}
                    >
                      Learned
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
