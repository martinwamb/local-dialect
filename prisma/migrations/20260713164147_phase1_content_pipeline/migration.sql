-- AlterTable
ALTER TABLE "units" ADD COLUMN     "targetLessonCount" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "targetStoryCount" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'seed';

-- CreateTable
CREATE TABLE "generator_logs" (
    "id" TEXT NOT NULL,
    "workerType" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unitsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "durationMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "generator_logs_pkey" PRIMARY KEY ("id")
);
