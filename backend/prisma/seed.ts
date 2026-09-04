import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OPEN_CHORDS = [
  "E minor",
  "E major",
  "A minor",
  "A major",
  "D major",
  "G major",
  "C major",
  "F major (barre)",
  "B minor (barre)",
];

async function main() {
  const teacherPassword = await bcrypt.hash("teach-ivyrox", 10);
  const studentPassword = await bcrypt.hash("play-ivyrox", 10);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@ivyrox.app" },
    update: {},
    create: { email: "teacher@ivyrox.app", name: "Teacher", role: "TEACHER", passwordHash: teacherPassword },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@ivyrox.app" },
    update: {},
    create: { email: "student@ivyrox.app", name: "Student", role: "STUDENT", passwordHash: studentPassword },
  });

  for (const chordName of OPEN_CHORDS) {
    await prisma.chordMastery.upsert({
      where: { studentId_chordName: { studentId: student.id, chordName } },
      update: {},
      create: { studentId: student.id, chordName },
    });
  }

  const songs = [
    {
      title: "Blackbird",
      artist: "The Beatles",
      type: "SONG" as const,
      tipsNote: "Fingerpicking pattern stays constant — focus on the thumb keeping steady bass notes.",
      isLibrary: true,
    },
    {
      title: "Wonderwall",
      artist: "Oasis",
      type: "SONG" as const,
      tipsNote: "Capo 2. Common beginner full-song target — mostly open chords with one clean strum pattern.",
      isLibrary: true,
    },
    {
      title: "Romanza (Spanish Romance)",
      artist: "Traditional",
      type: "SONG" as const,
      tipsNote: "Classical fingerstyle piece, good bridge from scales to a full arranged song.",
      isLibrary: true,
    },
    {
      title: "Chromatic Spider Walk",
      type: "EXERCISE" as const,
      tipsNote: "1-2-3-4 finger pattern across all strings. Start slow with a metronome, clean tone over speed.",
      isLibrary: true,
    },
    {
      title: "Alternating Bass Fingerpicking Drill",
      type: "EXERCISE" as const,
      tipsNote: "Thumb alternates root/5th while fingers pick a steady pattern — foundation for Blackbird.",
      isLibrary: false,
    },
  ];

  const createdSongs = [];
  for (const song of songs) {
    const existing = await prisma.song.findFirst({ where: { title: song.title } });
    createdSongs.push(existing ?? (await prisma.song.create({ data: song })));
  }

  const [blackbird, , , spiderWalk, bassDrill] = createdSongs;

  const existingAssignment = await prisma.assignment.findFirst({
    where: { studentId: student.id, songId: bassDrill.id },
  });
  if (!existingAssignment) {
    await prisma.assignment.create({
      data: {
        songId: bassDrill.id,
        studentId: student.id,
        assignedById: teacher.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: "Get comfortable at 70bpm before next lesson — we'll build Blackbird's intro on top of this.",
      },
    });
  }

  const existingSpiderAssignment = await prisma.assignment.findFirst({
    where: { studentId: student.id, songId: spiderWalk.id },
  });
  if (!existingSpiderAssignment) {
    await prisma.assignment.create({
      data: {
        songId: spiderWalk.id,
        studentId: student.id,
        assignedById: teacher.id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "PENDING_CONFIRMATION",
        markedDoneAt: new Date(),
        notes: "Daily warm-up, all four fingers.",
      },
    });
  }

  await prisma.libraryProgress.upsert({
    where: { studentId_songId: { studentId: student.id, songId: blackbird.id } },
    update: {},
    create: { studentId: student.id, songId: blackbird.id, status: "LEARNING" },
  });

  console.log("Seed complete.");
  console.log("  Teacher login: teacher@ivyrox.app / teach-ivyrox");
  console.log("  Student login: student@ivyrox.app / play-ivyrox");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
