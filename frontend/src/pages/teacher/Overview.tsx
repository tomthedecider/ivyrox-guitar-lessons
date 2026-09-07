import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { TeacherOverview as Overview } from "../../types";
import AudioPlayer from "../../components/AudioPlayer";
import { formatDate } from "../../lib/format";

export default function TeacherOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  async function load() {
    const data = await api.get<Overview>("/teacher/overview");
    setOverview(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await api.patch(`/assignments/${id}/approve`, { teacherComment: comments[id] || undefined });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      await api.patch(`/assignments/${id}/reject`, { teacherComment: comments[id] || undefined });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!overview) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Weekly overview</h1>
        <p className="text-sm text-muted">
          Week of {formatDate(overview.weekStart)} – {formatDate(overview.weekEnd)}
        </p>
      </div>

      <section>
        <h2 className="mb-2 font-medium">Pending your review ({overview.pendingReview.length})</h2>
        {overview.pendingReview.length === 0 ? (
          <p className="text-sm text-muted">Nothing waiting on you.</p>
        ) : (
          <ul className="space-y-3">
            {overview.pendingReview.map((a) => (
              <li key={a.id} className="rounded-xl border border-line bg-cyan-tint p-4 shadow-[0_0_20px_oklch(0.78_0.14_210_/_10%)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{a.song.title}</h3>
                    <p className="text-sm text-muted">
                      {a.student.name} marked this done {formatDate(a.markedDoneAt)}
                    </p>
                    {a.notes && <p className="mt-1 text-sm text-muted">Notes: {a.notes}</p>}
                    <div className="mt-2">
                      {a.recordingSize != null ? (
                        <AudioPlayer assignmentId={a.id} />
                      ) : (
                        <p className="text-xs text-dim">No recording attached.</p>
                      )}
                    </div>
                    <textarea
                      value={comments[a.id] ?? ""}
                      onChange={(e) => setComments({ ...comments, [a.id]: e.target.value })}
                      placeholder="Feedback for this attempt (optional)…"
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-line bg-chip px-3 py-2 text-sm text-ink placeholder:text-dim"
                    />
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => reject(a.id)}
                      disabled={busyId === a.id}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-chip hover:text-ink disabled:opacity-50"
                    >
                      Send back
                    </button>
                    <button
                      onClick={() => approve(a.id)}
                      disabled={busyId === a.id}
                      className="rounded-lg bg-[image:var(--grad)] px-3 py-1.5 text-sm font-medium text-accent-ink shadow-[0_0_16px_oklch(0.72_0.19_345_/_35%)] transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-medium">Assigned this week ({overview.assignedThisWeek.length})</h2>
        {overview.assignedThisWeek.length === 0 ? (
          <p className="text-sm text-muted">Nothing due this week.</p>
        ) : (
          <ul className="space-y-2">
            {overview.assignedThisWeek.map((a) => (
              <li key={a.id} className="rounded-xl border border-line bg-card p-3 text-sm">
                <span className="font-medium">{a.song.title}</span>{" "}
                <span className="text-dim">— {a.student.name}, due {formatDate(a.dueDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-medium">Chosen independently this week ({overview.independentPicks.length})</h2>
        {overview.independentPicks.length === 0 ? (
          <p className="text-sm text-muted">No self-serve library picks this week.</p>
        ) : (
          <ul className="space-y-2">
            {overview.independentPicks.map((p) => (
              <li key={p.id} className="rounded-xl border border-line bg-card p-3 text-sm">
                <span className="font-medium">{p.song.title}</span>{" "}
                <span className="text-dim">— {p.student.name}, added {formatDate(p.addedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
