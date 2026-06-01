import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DAILY_GOAL_XP, getXpForNextLevel } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [user, enrollments, todayXp] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { xpTotal: true, currentStreak: true, longestStreak: true, lastActiveAt: true, name: true, email: true, image: true },
    }),
    prisma.userLanguage.findMany({
      where: { userId },
      include: { language: true },
    }),
    prisma.xPLog.aggregate({
      where: {
        userId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { amount: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const todayXpTotal = todayXp._sum.amount ?? 0;
  const levelInfo = getXpForNextLevel(user.xpTotal);

  return NextResponse.json({
    user: { ...user, ...levelInfo },
    enrollments,
    todayXp: todayXpTotal,
    dailyGoal: DAILY_GOAL_XP,
    dailyGoalMet: todayXpTotal >= DAILY_GOAL_XP,
  });
}
