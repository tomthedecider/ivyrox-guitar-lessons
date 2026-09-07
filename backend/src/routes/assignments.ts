import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Practice-clip uploads: kept in memory (no persistent disk on this host)
// and capped well under Neon's free-tier storage ceiling — this app has two
// users, so a few MB per clip is fine, an unbounded upload is not.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

const reviewSchema = z.object({ teacherComment: z.string().max(1000).optional() });

// Teacher confirms during the lesson — this is what actually counts the
// assignment as learned. An optional comment travels with either verdict.
router.patch("/:id/approve", requireRole("TEACHER"), async (req: AuthedRequest, res) => {
  const parsed = reviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Assignment not found" });
  if (existing.status !== "PENDING_CONFIRMATION") {
    return res.status(409).json({ error: `Cannot approve from status ${existing.status}` });
  }

  const assignment = await prisma.assignment.update({
    where: { id: req.params.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      ...(parsed.data.teacherComment !== undefined ? { teacherComment: parsed.data.teacherComment } : {}),
    },
    include: { song: true, student: { select: { id: true, name: true } } },
  });
  res.json(assignment);
});

// Teacher sends a completed-too-early assignment back to the student instead
// of approving it.
router.patch("/:id/reject", requireRole("TEACHER"), async (req: AuthedRequest, res) => {
  const parsed = reviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Assignment not found" });
  if (existing.status !== "PENDING_CONFIRMATION") {
    return res.status(409).json({ error: `Cannot reject from status ${existing.status}` });
  }

  const assignment = await prisma.assignment.update({
    where: { id: req.params.id },
    data: {
      status: "ASSIGNED",
      markedDoneAt: null,
      ...(parsed.data.teacherComment !== undefined ? { teacherComment: parsed.data.teacherComment } : {}),
    },
    include: { song: true, student: { select: { id: true, name: true } } },
  });
  res.json(assignment);
});

// Student attaches (or replaces) a practice-clip recording for her own
// assignment. Allowed any time before the teacher has approved it, so she
// can re-record before a lesson.
router.post("/:id/recording", requireRole("STUDENT"), (req: AuthedRequest, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Recording too large (max 5MB)" });
    }
    if (err) return res.status(400).json({ error: "Upload failed" });
    next();
  });
}, async (req: AuthedRequest, res) => {
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.studentId !== req.user!.id) {
    return res.status(404).json({ error: "Assignment not found" });
  }
  if (existing.status === "APPROVED") {
    return res.status(409).json({ error: "Cannot attach a recording to an approved assignment" });
  }
  if (!req.file) return res.status(400).json({ error: "No audio file provided" });

  const assignment = await prisma.assignment.update({
    where: { id: req.params.id },
    data: {
      recording: req.file.buffer,
      recordingMimeType: req.file.mimetype,
      recordingSize: req.file.size,
      recordedAt: new Date(),
    },
    include: { song: true, student: { select: { id: true, name: true } } },
  });
  res.json(assignment);
});

// Either the owning student or the teacher can fetch the raw audio bytes.
router.get("/:id/recording", async (req: AuthedRequest, res) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: req.params.id },
    select: { studentId: true, recording: true, recordingMimeType: true },
  });
  if (!assignment || !assignment.recording) return res.status(404).json({ error: "No recording" });
  if (req.user!.role === "STUDENT" && assignment.studentId !== req.user!.id) {
    return res.status(404).json({ error: "No recording" });
  }

  res.setHeader("Content-Type", assignment.recordingMimeType || "application/octet-stream");
  res.send(assignment.recording);
});

export default router;
