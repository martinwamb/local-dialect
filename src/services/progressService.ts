import { prisma } from "@/lib/prisma";
import { XP } from "@/lib/constants";
import { checkAndUpdateStreak } from "./streakService";
import { evaluateBadges } from "./rewardsService";
import { LessonCompleteResult } from "@/types/rewards";

export async function completelesson(
  userId: string,
  lessonId: string,
  score: number,
  mistakeCount: number,
  durationSec?: number
): Promise<LessonCompleteResult> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { xpReward: true, type: true, unitId: true },
  });
  if (!lesson) throw new Error("Lesson not found");

  const { streakUpdated, newStreak, isFirstToday } = await checkAndUpdateStreak(userId);

  let xpEarned = lesson.type === "REVIEW" ? XP.LESSON_REVIEW
    : lesson.type === "CHALLENGE" ? XP.LESSON_CHALLENGE
    : XP.LESSON_BASE;

  if (mistakeCount === 0) xpEarned += XP.LESSON_PERFECT_BONUS;
  if (isFirstToday) xpEarned += XP.DAILY_FIRST_BONUS;

  // Persist lesson result and update user XP + language stats atomically
  await prisma.$transaction(async (tx) => {
    await tx.lessonResult.create({
      data: { userId, lessonId, score, xpEarned, mistakeCount, durationSec },
    });
    await tx.xPLog.create({
      data: { userId, amount: xpEarned, reason: "lesson_complete", metadata: { lessonId, score } },
    });
    await tx.user.update({
      where: { id: userId },
      data: { xpTotal: { increment: xpEarned } },
    });

    const lesson2 = await tx.lesson.findUnique({
      where: { id: lessonId },
      select: { unitId: true },
    });
    if (lesson2) {
      const unit = await tx.unit.findUnique({
        where: { id: lesson2.unitId },
        select: { languageId: true },
      });
      if (unit) {
        await tx.userLanguage.upsert({
          where: { userId_languageId: { userId, languageId: unit.languageId } },
          create: { userId, languageId: unit.languageId, xpEarned, lessonsCompleted: 1 },
          update: { xpEarned: { increment: xpEarned }, lessonsCompleted: { increment: 1 } },
        });
      }
    }
  });

  const newBadges = await evaluateBadges(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xpTotal: true },
  });

  return {
    xpEarned,
    newBadges,
    streakUpdated,
    newStreak,
    newXpTotal: user?.xpTotal ?? 0,
    isFirstLessonToday: isFirstToday,
  };
}
