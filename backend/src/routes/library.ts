import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// The browsable pool, each song annotated with this student's own progress
// (or null if she hasn't added it yet). Only students self-serve here.
router.get("/", requireRole("STUDENT"), async (req: AuthedRequest, res) => {
  const songs = await prisma.song.findMany({
    where: { isLibrary: true },
    orderBy: { title: "asc" },
    include: { libraryProgress: { where: { studentId: req.user!.id } } },
  });

  res.json(
    songs.map(({ libraryProgress, ...song }) => ({
      ...song,
      progress: libraryProgress[0] ?? null,
    }))
  );
});

// Student adds a library song to her own list — no approval needed.
router.post("/:songId", requireRole("STUDENT"), async (req: AuthedRequest, res) => {
  const song = await prisma.song.findUnique({ where: { id: req.params.songId } });
  if (!song || !song.isLibrary) return res.status(404).json({ error: "Song not found in library" });

  const progress = await prisma.libraryProgress.upsert({
    where: { studentId_songId: { studentId: req.user!.id, songId: req.params.songId } },
    update: {},
    create: { studentId: req.user!.id, songId: req.params.songId },
  });
  res.status(201).json(progress);
});

const toggleSchema = z.object({ status: z.enum(["LEARNING", "LEARNED"]) });

// Student flips learning <-> learned herself.
router.patch("/:songId", requireRole("STUDENT"), async (req: AuthedRequest, res) => {
  const parsed = toggleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const progress = await prisma.libraryProgress.update({
    where: { studentId_songId: { studentId: req.user!.id, songId: req.params.songId } },
    data: {
      status: parsed.data.status,
      learnedAt: parsed.data.status === "LEARNED" ? new Date() : null,
    },
  });
  res.json(progress);
});

router.delete("/:songId", requireRole("STUDENT"), async (req: AuthedRequest, res) => {
  await prisma.libraryProgress
    .delete({ where: { studentId_songId: { studentId: req.user!.id, songId: req.params.songId } } })
    .catch(() => null);
  res.status(204).end();
});

export default router;
