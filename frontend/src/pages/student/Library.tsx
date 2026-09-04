import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { LibrarySong, LibraryStatus } from "../../types";

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

  if (loading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Song library</h1>
        <p className="text-sm text-stone-500">Browse and pick up anything you like — no approval needed.</p>
      </div>

      <ul className="space-y-3">
        {songs.map((song) => (
          <li key={song.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">{song.title}</h2>
                {song.artist && <p className="text-sm text-stone-500">{song.artist}</p>}
                <div className="mt-2 flex gap-3 text-sm">
                  {song.tabUrl && (
                    <a href={song.tabUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      Tab / chord sheet
                    </a>
                  )}
                  {song.referenceUrl && (
                    <a href={song.referenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      Reference recording
                    </a>
                  )}
                </div>
                {song.tipsNote && <p className="mt-2 text-sm italic text-stone-500">Tip: {song.tipsNote}</p>}
              </div>

              <div className="shrink-0">
                {!song.progress ? (
                  <button
                    onClick={() => add(song.id)}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-100"
                  >
                    Add to my list
                  </button>
                ) : (
                  <div className="flex gap-1 rounded-lg border border-stone-300 p-0.5 text-sm">
                    <button
                      onClick={() => setStatus(song.id, "LEARNING")}
                      className={`rounded-md px-2 py-1 ${
                        song.progress.status === "LEARNING" ? "bg-amber-100 text-amber-800" : "text-stone-500"
                      }`}
                    >
                      Learning
                    </button>
                    <button
                      onClick={() => setStatus(song.id, "LEARNED")}
                      className={`rounded-md px-2 py-1 ${
                        song.progress.status === "LEARNED" ? "bg-emerald-100 text-emerald-800" : "text-stone-500"
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
