import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { toDayStart } from "../lib/date";

const router = Router();
router.use(requireAuth, requireRole("TEACHER"));

function startOfWeek(date: Date): Date {
  const day = toDayStart(date);
  const weekday = day.getUTCDay(); // 0 = Sunday
  day.setUTCDate(day.getUTCDate() - weekday);
  return day;
}

// One screen for the teacher's weekly prep: what's assigned and due this
// week, what's awaiting review, and what the student picked up on her own.
router.get("/overview", async (_req, res) => {
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [assignedThisWeek, pendingReview, independentPicks] = await Promise.all([
    prisma.assignment.findMany({
      where: { status: "ASSIGNED", dueDate: { gte: weekStart, lt: weekEnd } },
      include: { song: true, student: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.assignment.findMany({
      where: { status: "PENDING_CONFIRMATION" },
      include: { song: true, student: { select: { id: true, name: true } } },
      orderBy: { markedDoneAt: "asc" },
    }),
    prisma.libraryProgress.findMany({
      where: { addedAt: { gte: weekStart, lt: weekEnd } },
      include: { song: true, student: { select: { id: true, name: true } } },
      orderBy: { addedAt: "desc" },
    }),
  ]);

  res.json({ weekStart, weekEnd, assignedThisWeek, pendingReview, independentPicks });
});

// Populates the student picker on the "new assignment" form.
router.get("/students", async (_req, res) => {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json(students);
});

export default router;
