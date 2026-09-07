import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import { Song } from "../../types";

interface StudentOption {
  id: string;
  name: string;
}

export default function TeacherAssign() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [songId, setSongId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");

  useEffect(() => {
    Promise.all([api.get<Song[]>("/songs"), api.get<StudentOption[]>("/teacher/students")]).then(([s, st]) => {
      setSongs(s);
      setStudents(st);
      if (s[0]) setSongId(s[0].id);
      if (st[0]) setStudentId(st[0].id);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    await api.post("/assignments", {
      songId,
      studentId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      notes: notes || undefined,
    });
    setNotes("");
    setDueDate("");
    setStatus("done");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New assignment</h1>
        <p className="text-sm text-muted">Assign a song or exercise with a due date.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-card p-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-lg border border-line bg-chip px-3 py-2 text-ink"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted">Song or exercise</label>
          <select
            value={songId}
            onChange={(e) => setSongId(e.target.value)}
            className="w-full rounded-lg border border-line bg-chip px-3 py-2 text-ink"
          >
            {songs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.type === "EXERCISE" ? "(exercise)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-dim">Need something new? Add it in Catalog first.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-chip px-3 py-2 text-ink"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line bg-chip px-3 py-2 text-ink placeholder:text-dim"
            placeholder="What to focus on this week…"
          />
        </div>

        <button
          type="submit"
          disabled={!songId || !studentId || status === "saving"}
          className="w-full rounded-lg bg-[image:var(--grad)] px-3 py-2 font-medium text-accent-ink shadow-[0_0_16px_oklch(0.72_0.19_345_/_35%)] transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
        >
          {status === "saving" ? "Assigning…" : status === "done" ? "Assigned ✓" : "Assign"}
        </button>
      </form>
    </div>
  );
}
