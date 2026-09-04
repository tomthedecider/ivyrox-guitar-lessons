const STYLES: Record<string, string> = {
  ASSIGNED: "bg-amber-100 text-amber-800",
  PENDING_CONFIRMATION: "bg-blue-100 text-blue-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  LEARNING: "bg-amber-100 text-amber-800",
  LEARNED: "bg-emerald-100 text-emerald-800",
};

const LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  PENDING_CONFIRMATION: "Pending review",
  APPROVED: "Approved",
  LEARNING: "Learning",
  LEARNED: "Learned",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-stone-100 text-stone-700"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
