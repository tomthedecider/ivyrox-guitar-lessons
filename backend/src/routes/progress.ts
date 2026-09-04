import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth";
import { computeStreak, toDayStart } from "../lib/date";

const router = Router();
router.use(requireAuth);

// A student views her own progress; a teacher can pass ?studentId= to view
// the (one) student's.
function resolveStudentId(req: AuthedRequest): string | null {
  if (req.user!.role === "STUDENT") return req.user!.id;
  const id = req.query.studentId;
  return typeof id === "string" ? id : null;
}

// Combined timeline of everything that counts as "learned": approved
// assignments and library songs the student marked learned herself.
router.get("/songs-learned", async (req: AuthedRequest, res) => {
  const studentId = resolveStudentId(req);
  if (!studentId) return res.status(400).json({ error: "studentId is required" });

  const [approved, learnedLibrary] = await Promise.all([
    prisma.assignment.findMany({
      where: { studentId, status: "APPROVED" },
      include: { song: true },
      orderBy: { approvedAt: "asc" },
    }),
    prisma.libraryProgress.findMany({
      where: { studentId, status: "LEARNED" },
      include: { song: true },
      orderBy: { learnedAt: "asc" },
    }),
  ]);

  const timeline = [
    ...approved.map((a) => ({
      source: "assignment" as const,
      songId: a.songId,
      title: a.song.title,
      type: a.song.type,
      learnedAt: a.approvedAt,
    })),
    ...learnedLibrary.map((l) => ({
      source: "library" as const,
      songId: l.songId,
      title: l.song.title,
      type: l.song.type,
      learnedAt: l.learnedAt,
    })),
  ].sort((a, b) => new Date(a.learnedAt ?? 0).getTime() - new Date(b.learnedAt ?? 0).getTime());

  res.json(timeline);
});

router.get("/chords", async (req: AuthedRequest, res) => {
  const studentId = resolveStudentId(req);
  if (!studentId) return res.status(400).json({ error: "studentId is required" });

  const chords = await prisma.chordMastery.findMany({
    where: { studentId },
    orderBy: { chordName: "asc" },
  });
  res.json(chords);
});

const chordSchema = z.object({ chordName: z.string().min(1), mastered: z.boolean() });

// The student checks off her own chord list. `upsert` lets a fresh chord be
// checked without a separate "add chord" step.
router.put("/chords", requireRole("STUDENT"), async (req: AuthedRequest, res) => {
  const parsed = chordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { chordName, mastered } = parsed.data;

  const chord = await prisma.chordMastery.upsert({
    where: { studentId_chordName: { studentId: req.user!.id, chordName } },
    update: { mastered, masteredAt: mastered ? new Date() : null },
    create: { studentId: req.user!.id, chordName, mastered, masteredAt: mastered ? new Date() : null },
  });
  res.json(chord);
});

router.get("/streak", async (req: AuthedRequest, res) => {
  const studentId = resolveStudentId(req);
  if (!studentId) return res.status(400).json({ error: "studentId is required" });

  const logs = await prisma.practiceLog.findMany({ where: { studentId } });
  const practicedToday = logs.some((l) => toDayStart(l.date).getTime() === toDayStart(new Date()).getTime());

  res.json({
    currentStreak: computeStreak(logs.map((l) => l.date)),
    practicedToday,
    totalDaysPracticed: logs.length,
  });
});

// Student logs today's practice. Idempotent — logging twice in a day is a no-op.
router.post("/practice", requireRole("STUDENT"), async (req: AuthedRequest, res) => {
  const today = toDayStart(new Date());
  await prisma.practiceLog.upsert({
    where: { studentId_date: { studentId: req.user!.id, date: today } },
    update: {},
    create: { studentId: req.user!.id, date: today },
  });

  const logs = await prisma.practiceLog.findMany({ where: { studentId: req.user!.id } });
  res.status(201).json({ currentStreak: computeStreak(logs.map((l) => l.date)), practicedToday: true });
});

export default router;
