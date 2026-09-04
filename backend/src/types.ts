// SQLite has no native enum support, so the Prisma schema stores these as
// plain strings. These types are the source of truth for the allowed values.
export type Role = "TEACHER" | "STUDENT";
export type SongType = "SONG" | "EXERCISE";
export type AssignmentStatus = "ASSIGNED" | "PENDING_CONFIRMATION" | "APPROVED";
export type LibraryStatus = "LEARNING" | "LEARNED";
