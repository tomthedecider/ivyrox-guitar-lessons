import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Student sees her own assignments; teacher sees everyone's (in practice, the
// one student this app is built for).
router.get("/", async (req: AuthedRequest, res) => {
  const where = req.user!.role === "STUDENT" ? { studentId: req.user!.id } : {};
  const assignments = await prisma.assignment.findMany({
    where,
    include: { song: true, student: { select: { id: true, name: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
  res.json(assignments);
});

const createSchema = z.object({
  songId: z.string().min(1),
  studentId: z.string().min(1),
  dueDate: z.string().datetime().optional().or(z.literal("")),
  notes: z.string().optional(),
});

router.post("/", requireRole("TEACHER"), async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { songId, studentId, dueDate, notes } = parsed.data;
  const assignment = await prisma.assignment.create({
    data: {
      songId,
      studentId,
      assignedById: req.user!.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    },
    include: { song: true, student: { select: { id: true, name: true } } },
  });
  res.status(201).json(assignment);
});

// Student marks her own assignment done — this does not finish it, it moves
// it into PENDING_CONFIRMATION for the teacher to review next lesson.
router.patch("/:id/mark-done", requireRole("STUDENT"), async (req: AuthedRequest, res) => {
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.studentId !== req.user!.id) {
    return res.status(404).json({ error: "Assignment not found" });
  }
  if (existing.status !== "ASSIGNED") {
    return res.status(409).json({ error: `Cannot mark done from status ${existing.status}` });
  }

  const assignment = await prisma.assignment.update({
    where: { id: req.params.id },
    data: { status: "PENDING_CONFIRMATION", markedDoneAt: new Date() },
    include: { song: true, student: { select: { id: true, name: true } } },
  });
  res.json(assignment);
});

// Teacher confirms during the lesson — this is what actually counts the
// assignment as learned.
router.patch("/:id/approve", requireRole("TEACHER"), async (req: AuthedRequest, res) => {
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Assignment not found" });
  if (existing.status !== "PENDING_CONFIRMATION") {
    return res.status(409).json({ error: `Cannot approve from status ${existing.status}` });
  }

  const assignment = await prisma.assignment.update({
    where: { id: req.params.id },
    data: { status: "APPROVED", approvedAt: new Date() },
    include: { song: true, student: { select: { id: true, name: true } } },
  });
  res.json(assignment);
});

// Teacher sends a completed-too-early assignment back to the student instead
// of approving it.
router.patch("/:id/reject", requireRole("TEACHER"), async (req: AuthedRequest, res) => {
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Assignment not found" });
  if (existing.status !== "PENDING_CONFIRMATION") {
    return res.status(409).json({ error: `Cannot reject from status ${existing.status}` });
  }

  const assignment = await prisma.assignment.update({
    where: { id: req.params.id },
    data: { status: "ASSIGNED", markedDoneAt: null },
    include: { song: true, student: { select: { id: true, name: true } } },
  });
  res.json(assignment);
});

export default router;
