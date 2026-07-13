-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED');

-- AlterEnum
ALTER TYPE "LessonType" ADD VALUE 'QUIZ';

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "stage" "Stage" NOT NULL DEFAULT 'BEGINNER';

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "introContent" JSONB;

-- AlterTable
ALTER TABLE "user_languages" ADD COLUMN     "unlockedStage" "Stage" NOT NULL DEFAULT 'BEGINNER';
