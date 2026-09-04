import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Full catalog. Both roles can read it — the student needs it to browse the
// library, the teacher needs it to pick songs for assignments.
router.get("/", async (_req, res) => {
  const songs = await prisma.song.findMany({ orderBy: { title: "asc" } });
  res.json(songs);
});

const songSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional(),
  type: z.enum(["SONG", "EXERCISE"]).default("SONG"),
  tabUrl: z.string().url().optional().or(z.literal("")),
  referenceUrl: z.string().url().optional().or(z.literal("")),
  tipsNote: z.string().optional(),
  isLibrary: z.boolean().default(true),
});

// Only the teacher curates the catalog.
router.post("/", requireRole("TEACHER"), async (req, res) => {
  const parsed = songSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const song = await prisma.song.create({
    data: {
      ...parsed.data,
      tabUrl: parsed.data.tabUrl || undefined,
      referenceUrl: parsed.data.referenceUrl || undefined,
    },
  });
  res.status(201).json(song);
});

router.patch("/:id", requireRole("TEACHER"), async (req: AuthedRequest, res) => {
  const parsed = songSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const song = await prisma.song.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(song);
});

export default router;
