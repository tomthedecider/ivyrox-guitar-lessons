export type Role = "TEACHER" | "STUDENT";
export type SongType = "SONG" | "EXERCISE";
export type AssignmentStatus = "ASSIGNED" | "PENDING_CONFIRMATION" | "APPROVED";
export type LibraryStatus = "LEARNING" | "LEARNED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Song {
  id: string;
  title: string;
  artist?: string | null;
  type: SongType;
  tabUrl?: string | null;
  referenceUrl?: string | null;
  tipsNote?: string | null;
  isLibrary: boolean;
}

export interface LibraryProgress {
  id: string;
  studentId: string;
  songId: string;
  status: LibraryStatus;
  addedAt: string;
  learnedAt: string | null;
}

export interface LibrarySong extends Song {
  progress: LibraryProgress | null;
}

export interface Assignment {
  id: string;
  songId: string;
  studentId: string;
  assignedById: string;
  dueDate: string | null;
  notes: string | null;
  status: AssignmentStatus;
  markedDoneAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  song: Song;
  student: { id: string; name: string };
}

export interface ChordMastery {
  id: string;
  chordName: string;
  mastered: boolean;
  masteredAt: string | null;
}

export interface SongLearnedEntry {
  source: "assignment" | "library";
  songId: string;
  title: string;
  type: SongType;
  learnedAt: string | null;
}

export interface StreakInfo {
  currentStreak: number;
  practicedToday: boolean;
  totalDaysPracticed: number;
}

export interface TeacherOverview {
  weekStart: string;
  weekEnd: string;
  assignedThisWeek: Assignment[];
  pendingReview: Assignment[];
  independentPicks: (LibraryProgress & { song: Song; student: { id: string; name: string } })[];
}
