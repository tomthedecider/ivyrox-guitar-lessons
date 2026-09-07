-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "recordedAt" TIMESTAMP(3),
ADD COLUMN     "recording" BYTEA,
ADD COLUMN     "recordingMimeType" TEXT,
ADD COLUMN     "recordingSize" INTEGER,
ADD COLUMN     "teacherComment" TEXT;
