const STYLES: Record<string, string> = {
  ASSIGNED: "bg-violet-tint text-violet",
  PENDING_CONFIRMATION: "bg-cyan-tint text-cyan",
  APPROVED: "bg-gold-tint text-gold",
  LEARNING: "bg-violet-tint text-violet",
  LEARNED: "bg-gold-tint text-gold",
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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-chip text-muted"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
