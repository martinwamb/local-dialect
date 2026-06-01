import { prisma } from "@/lib/prisma";

function toUTCDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function checkAndUpdateStreak(userId: string): Promise<{
  streakUpdated: boolean;
  newStreak: number;
  isFirstToday: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveAt: true },
  });
  if (!user) throw new Error("User not found");

  const today = toUTCDate(new Date());
  const lastActive = user.lastActiveAt ? toUTCDate(user.lastActiveAt) : null;

  if (lastActive === today) {
    return { streakUpdated: false, newStreak: user.currentStreak, isFirstToday: false };
  }

  const yesterday = toUTCDate(new Date(Date.now() - 86400000));
  let newStreak: number;
  if (lastActive === yesterday) {
    newStreak = user.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, user.longestStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveAt: new Date(),
    },
  });

  return { streakUpdated: true, newStreak, isFirstToday: true };
}
