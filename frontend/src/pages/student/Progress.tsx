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

  if (loading || !streak) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Your progress</h1>
        <p className="text-sm text-muted">Everything you've built up so far.</p>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Practice streak</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full p-[5px] shadow-[0_0_26px_oklch(0.66_0.2_300_/_40%)]"
            style={{
              background:
                "conic-gradient(oklch(0.72 0.19 345), oklch(0.66 0.2 300), oklch(0.78 0.14 210), oklch(0.72 0.19 345))",
            }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card">
              <span className="font-display text-2xl font-extrabold leading-none tabular-nums">
                {streak.currentStreak}
              </span>
              <span className="mt-1 text-[11px] text-muted">day{streak.currentStreak === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div className="min-w-[150px] flex-1">
            <p className="text-sm text-muted">{streak.totalDaysPracticed} total days practiced</p>
            <button
              onClick={logPractice}
              disabled={streak.practicedToday || logging}
              className="mt-3 rounded-lg bg-[image:var(--grad)] px-3 py-1.5 text-sm font-medium text-accent-ink shadow-[0_0_16px_oklch(0.72_0.19_345_/_35%)] transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
            >
              {streak.practicedToday ? "Practiced today ✓" : "Log today's practice"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="mb-3 font-medium">Chord mastery checklist</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {chords.map((chord) => (
            <li key={chord.id}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan ${
                  chord.mastered
                    ? "border-gold-line bg-gold-tint text-gold shadow-[0_0_14px_oklch(0.8_0.15_85_/_20%)]"
                    : "border-line text-muted hover:bg-chip"
                }`}
              >
                <input type="checkbox" checked={chord.mastered} onChange={() => toggleChord(chord)} className="sr-only" />
                {chord.mastered ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-line" />
                )}
                {chord.chordName}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="mb-4 font-medium">Songs learned over time</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted">Nothing yet — it'll show up here once approved or marked learned.</p>
        ) : (
          <ol className="relative space-y-4 pl-5">
            <div
              className="absolute bottom-1 left-[3px] top-1 w-0.5"
              style={{ background: "linear-gradient(oklch(0.72 0.19 345), oklch(0.8 0.15 85))" }}
            />
            {timeline.map((entry, i) => (
              <li key={`${entry.songId}-${i}`} className="relative text-sm">
                <span
                  className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full"
                  style={{
                    background: entry.source === "assignment" ? "oklch(0.72 0.19 345)" : "oklch(0.8 0.15 85)",
                    boxShadow:
                      entry.source === "assignment"
                        ? "0 0 10px oklch(0.72 0.19 345 / 60%)"
                        : "0 0 10px oklch(0.8 0.15 85 / 60%)",
                  }}
                />
                <span className="font-medium">{entry.title}</span>{" "}
                <span className="text-dim">
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
