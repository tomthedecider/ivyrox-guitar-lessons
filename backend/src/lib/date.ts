/** Normalizes any Date to midnight UTC, so one row per calendar day works as a uniqueness key. */
export function toDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toDayStart(a).getTime() - toDayStart(b).getTime()) / msPerDay);
}

/** Current streak of consecutive days practiced, counting back from today (or yesterday, so today's streak isn't reset before the student has had a chance to practice). */
export function computeStreak(practiceDates: Date[]): number {
  if (practiceDates.length === 0) return 0;

  const daySet = new Set(practiceDates.map((d) => toDayStart(d).getTime()));
  const today = toDayStart(new Date());
  const oneDay = 24 * 60 * 60 * 1000;

  let cursor = today.getTime();
  if (!daySet.has(cursor)) {
    cursor -= oneDay; // haven't practiced yet today — check if yesterday keeps the streak alive
    if (!daySet.has(cursor)) return 0;
  }

  let streak = 0;
  while (daySet.has(cursor)) {
    streak += 1;
    cursor -= oneDay;
  }
  return streak;
}
