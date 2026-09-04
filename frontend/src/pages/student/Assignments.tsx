import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Assignment } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, isOverdue } from "../../lib/format";

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const data = await api.get<Assignment[]>("/assignments");
    setAssignments(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markDone(id: string) {
    setBusyId(id);
    try {
      await api.patch(`/assignments/${id}/mark-done`);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Your assignments</h1>
        <p className="text-sm text-stone-500">Weekly songs and exercises from your teacher.</p>
      </div>

      {assignments.length === 0 && <p className="text-stone-500">No assignments yet — check back after your next lesson.</p>}

      <ul className="space-y-3">
        {assignments.map((a) => (
          <li key={a.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{a.song.title}</h2>
                  <StatusBadge status={a.status} />
                </div>
                {a.song.artist && <p className="text-sm text-stone-500">{a.song.artist}</p>}
                <p className={`mt-1 text-sm ${isOverdue(a.dueDate) && a.status === "ASSIGNED" ? "text-red-600" : "text-stone-500"}`}>
                  Due {formatDate(a.dueDate)}
                </p>
                {a.notes && <p className="mt-2 text-sm text-stone-700">{a.notes}</p>}
                <div className="mt-2 flex gap-3 text-sm">
                  {a.song.tabUrl && (
                    <a href={a.song.tabUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      Tab / chord sheet
                    </a>
                  )}
                  {a.song.referenceUrl && (
                    <a href={a.song.referenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      Reference recording
                    </a>
                  )}
                </div>
                {a.song.tipsNote && <p className="mt-2 text-sm italic text-stone-500">Tip: {a.song.tipsNote}</p>}
              </div>
              {a.status === "ASSIGNED" && (
                <button
                  onClick={() => markDone(a.id)}
                  disabled={busyId === a.id}
                  className="shrink-0 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  Mark done
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
