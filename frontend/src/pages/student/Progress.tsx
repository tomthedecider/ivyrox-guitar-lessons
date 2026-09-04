import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { ChordMastery, SongLearnedEntry, StreakInfo } from "../../types";
import { formatDate } from "../../lib/format";

export default function StudentProgress() {
  const [timeline, setTimeline] = useState<SongLearnedEntry[]>([]);
  const [chords, setChords] = useState<ChordMastery[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  async function load() {
    const [t, c, s] = await Promise.all([
      api.get<SongLearnedEntry[]>("/progress/songs-learned"),
      api.get<ChordMastery[]>("/progress/chords"),
      api.get<StreakInfo>("/progress/streak"),
    ]);
    setTimeline(t);
    setChords(c);
    setStreak(s);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleChord(chord: ChordMastery) {
    await api.put("/progress/chords", { chordName: chord.chordName, mastered: !chord.mastered });
    await load();
  }

  async function logPractice() {
    setLogging(true);
    try {
      await api.post("/progress/practice");
      await load();
    } finally {
      setLogging(false);
    }
  }

  if (loading || !streak) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Your progress</h1>
        <p className="text-sm text-stone-500">Everything you've built up so far.</p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Practice streak</h2>
            <p className="text-3xl font-semibold tabular-nums">
              {streak.currentStreak} <span className="text-base font-normal text-stone-500">day{streak.currentStreak === 1 ? "" : "s"}</span>
            </p>
            <p className="text-sm text-stone-500">{streak.totalDaysPracticed} total days practiced</p>
          </div>
          <button
            onClick={logPractice}
            disabled={streak.practicedToday || logging}
            className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {streak.practicedToday ? "Practiced today ✓" : "Log today's practice"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 font-medium">Chord mastery checklist</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {chords.map((chord) => (
            <li key={chord.id}>
              <label className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={chord.mastered} onChange={() => toggleChord(chord)} />
                {chord.chordName}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 font-medium">Songs learned over time</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing yet — it'll show up here once approved or marked learned.</p>
        ) : (
          <ol className="space-y-2 border-l-2 border-stone-200 pl-4">
            {timeline.map((entry, i) => (
              <li key={`${entry.songId}-${i}`} className="text-sm">
                <span className="font-medium">{entry.title}</span>{" "}
                <span className="text-stone-500">
                  — {formatDate(entry.learnedAt)} · {entry.source === "assignment" ? "assigned" : "self-picked"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
