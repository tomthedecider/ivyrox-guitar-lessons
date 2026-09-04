import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { TeacherOverview as Overview } from "../../types";
import { formatDate } from "../../lib/format";

export default function TeacherOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      await api.patch(`/assignments/${id}/approve`);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      await api.patch(`/assignments/${id}/reject`);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!overview) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Weekly overview</h1>
        <p className="text-sm text-stone-500">
          Week of {formatDate(overview.weekStart)} – {formatDate(overview.weekEnd)}
        </p>
      </div>

      <section>
        <h2 className="mb-2 font-medium">Pending your review ({overview.pendingReview.length})</h2>
        {overview.pendingReview.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing waiting on you.</p>
        ) : (
          <ul className="space-y-3">
            {overview.pendingReview.map((a) => (
              <li key={a.id} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{a.song.title}</h3>
                    <p className="text-sm text-stone-600">
                      {a.student.name} marked this done {formatDate(a.markedDoneAt)}
                    </p>
                    {a.notes && <p className="mt-1 text-sm text-stone-600">Notes: {a.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => reject(a.id)}
                      disabled={busyId === a.id}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-white disabled:opacity-50"
                    >
                      Send back
                    </button>
                    <button
                      onClick={() => approve(a.id)}
                      disabled={busyId === a.id}
                      className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
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
          <p className="text-sm text-stone-500">Nothing due this week.</p>
        ) : (
          <ul className="space-y-2">
            {overview.assignedThisWeek.map((a) => (
              <li key={a.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
                <span className="font-medium">{a.song.title}</span> — {a.student.name}, due {formatDate(a.dueDate)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-medium">Chosen independently this week ({overview.independentPicks.length})</h2>
        {overview.independentPicks.length === 0 ? (
          <p className="text-sm text-stone-500">No self-serve library picks this week.</p>
        ) : (
          <ul className="space-y-2">
            {overview.independentPicks.map((p) => (
              <li key={p.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
                <span className="font-medium">{p.song.title}</span> — {p.student.name}, added {formatDate(p.addedAt)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
