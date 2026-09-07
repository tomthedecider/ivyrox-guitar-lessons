import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import { Song, SongType } from "../../types";

const emptyForm = {
  title: "",
  artist: "",
  type: "SONG" as SongType,
  tabUrl: "",
  referenceUrl: "",
  tipsNote: "",
  isLibrary: true,
};

export default function TeacherCatalog() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setSongs(await api.get<Song[]>("/songs"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/songs", form);
      setForm(emptyForm);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Song catalog</h1>
        <p className="text-sm text-muted">Everything assignable or browsable in the library.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-line bg-card p-5 sm:grid-cols-2">
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-lg border border-line bg-chip px-3 py-2 text-ink placeholder:text-dim sm:col-span-2"
        />
        <input
          placeholder="Artist (optional)"
          value={form.artist}
          onChange={(e) => setForm({ ...form, artist: e.target.value })}
          className="rounded-lg border border-line bg-chip px-3 py-2 text-ink placeholder:text-dim"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as SongType })}
          className="rounded-lg border border-line bg-chip px-3 py-2 text-ink"
        >
          <option value="SONG">Song</option>
          <option value="EXERCISE">Exercise</option>
        </select>
        <input
          placeholder="Tab / chord sheet URL"
          value={form.tabUrl}
          onChange={(e) => setForm({ ...form, tabUrl: e.target.value })}
          className="rounded-lg border border-line bg-chip px-3 py-2 text-ink placeholder:text-dim sm:col-span-2"
        />
        <input
          placeholder="Reference recording / video URL"
          value={form.referenceUrl}
          onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })}
          className="rounded-lg border border-line bg-chip px-3 py-2 text-ink placeholder:text-dim sm:col-span-2"
        />
        <textarea
          placeholder="Tips note"
          value={form.tipsNote}
          onChange={(e) => setForm({ ...form, tipsNote: e.target.value })}
          rows={2}
          className="rounded-lg border border-line bg-chip px-3 py-2 text-ink placeholder:text-dim sm:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isLibrary}
            onChange={(e) => setForm({ ...form, isLibrary: e.target.checked })}
            className="accent-violet"
          />
          Show in the student's optional library
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[image:var(--grad)] px-3 py-2 font-medium text-accent-ink shadow-[0_0_16px_oklch(0.72_0.19_345_/_35%)] transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none sm:col-span-2"
        >
          {saving ? "Adding…" : "Add to catalog"}
        </button>
      </form>

      <ul className="space-y-2">
        {songs.map((song) => (
          <li key={song.id} className="rounded-xl border border-line bg-card p-3 text-sm">
            <span className="font-medium">{song.title}</span>
            {song.artist && <span className="text-dim"> — {song.artist}</span>}
            <span className="ml-2 rounded-full bg-chip px-2 py-0.5 text-xs text-muted">{song.type}</span>
            {!song.isLibrary && <span className="ml-2 text-xs text-dim">assignment-only</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
