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
        <p className="text-sm text-stone-500">Everything assignable or browsable in the library.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
        />
        <input
          placeholder="Artist (optional)"
          value={form.artist}
          onChange={(e) => setForm({ ...form, artist: e.target.value })}
          className="rounded-lg border border-stone-300 px-3 py-2"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as SongType })}
          className="rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="SONG">Song</option>
          <option value="EXERCISE">Exercise</option>
        </select>
        <input
          placeholder="Tab / chord sheet URL"
          value={form.tabUrl}
          onChange={(e) => setForm({ ...form, tabUrl: e.target.value })}
          className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
        />
        <input
          placeholder="Reference recording / video URL"
          value={form.referenceUrl}
          onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })}
          className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
        />
        <textarea
          placeholder="Tips note"
          value={form.tipsNote}
          onChange={(e) => setForm({ ...form, tipsNote: e.target.value })}
          rows={2}
          className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isLibrary}
            onChange={(e) => setForm({ ...form, isLibrary: e.target.checked })}
          />
          Show in the student's optional library
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-stone-900 px-3 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-50 sm:col-span-2"
        >
          {saving ? "Adding…" : "Add to catalog"}
        </button>
      </form>

      <ul className="space-y-2">
        {songs.map((song) => (
          <li key={song.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
            <span className="font-medium">{song.title}</span>
            {song.artist && <span className="text-stone-500"> — {song.artist}</span>}
            <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{song.type}</span>
            {!song.isLibrary && <span className="ml-2 text-xs text-stone-400">assignment-only</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
