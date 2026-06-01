import { prisma } from "@/lib/prisma";
import { BadgeRecord } from "@/types/rewards";

interface UserStats {
  xpTotal: number;
  currentStreak: number;
  totalLessons: number;
  perfectLessons: number;
  languageCount: number;
  unitsCompleted: number;
}

async function getUserStats(userId: string): Promise<UserStats> {
  const [user, results, languageCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { xpTotal: true, currentStreak: true },
    }),
    prisma.lessonResult.findMany({
      where: { userId },
      select: { mistakeCount: true, lessonId: true },
    }),
    prisma.userLanguage.count({ where: { userId } }),
  ]);

  const perfectLessons = results.filter((r: { mistakeCount: number }) => r.mistakeCount === 0).length;

  // Count units where all lessons are completed
  const completedLessonIds = new Set(results.map((r: { lessonId: string }) => r.lessonId));
  const units = await prisma.unit.findMany({
    include: { lessons: { select: { id: true } } },
  });
  const unitsCompleted = units.filter((u: { lessons: { id: string }[] }) =>
    u.lessons.every((l: { id: string }) => completedLessonIds.has(l.id))
  ).length;

  return {
    xpTotal: user?.xpTotal ?? 0,
    currentStreak: user?.currentStreak ?? 0,
    totalLessons: results.length,
    perfectLessons,
    languageCount,
    unitsCompleted,
  };
}

export async function evaluateBadges(userId: string): Promise<BadgeRecord[]> {
  const [stats, earnedBadgeIds, allBadges] = await Promise.all([
    getUserStats(userId),
    prisma.userBadge
      .findMany({ where: { userId }, select: { badgeId: true } })
      .then((rows: { badgeId: string }[]) => new Set(rows.map((r) => r.badgeId))),
    prisma.badge.findMany(),
  ]);

  const newBadges: BadgeRecord[] = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;
    const criteria = badge.criteria as { type: string; threshold: number };

    let earned = false;
    switch (criteria.type) {
      case "lesson_count":
        earned = stats.totalLessons >= criteria.threshold;
        break;
      case "streak_days":
        earned = stats.currentStreak >= criteria.threshold;
        break;
      case "xp_total":
        earned = stats.xpTotal >= criteria.threshold;
        break;
      case "perfect_lessons":
        earned = stats.perfectLessons >= criteria.threshold;
        break;
      case "unit_complete":
        earned = stats.unitsCompleted >= criteria.threshold;
        break;
      case "language_count":
        earned = stats.languageCount >= criteria.threshold;
        break;
    }

    if (earned) {
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      if (badge.xpBonus > 0) {
        await prisma.xPLog.create({
          data: { userId, amount: badge.xpBonus, reason: "badge_earned", metadata: { badgeId: badge.id } },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { xpTotal: { increment: badge.xpBonus } },
        });
      }
      newBadges.push(badge as unknown as BadgeRecord);
    }
  }

  return newBadges;
}
