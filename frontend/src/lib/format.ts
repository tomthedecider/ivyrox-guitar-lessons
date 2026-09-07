export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

// Picks a tempo out of a tip like "Get comfortable at 70bpm before next
// lesson" for the metronome's starting point. Best-effort — free text, so
// no match just means the metronome starts at its own default.
export function parseBpm(tipsNote: string | null | undefined): number | null {
  if (!tipsNote) return null;
  const match = tipsNote.match(/(\d{2,3})\s*bpm/i);
  return match ? Number(match[1]) : null;
}
