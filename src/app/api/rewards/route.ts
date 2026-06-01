import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [allBadges, userBadges] = await Promise.all([
    prisma.badge.findMany({ orderBy: { name: "asc" } }),
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
  ]);

  const earnedIds = new Set(userBadges.map((ub) => ub.badgeId));

  return NextResponse.json({
    earned: userBadges,
    all: allBadges.map((b) => ({ ...b, isEarned: earnedIds.has(b.id) })),
  });
}
