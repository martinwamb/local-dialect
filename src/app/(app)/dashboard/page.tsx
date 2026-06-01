import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DAILY_GOAL_XP, getXpForNextLevel } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, enrollments, todayXpAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { xpTotal: true, currentStreak: true, longestStreak: true, name: true },
    }),
    prisma.userLanguage.findMany({
      where: { userId },
      include: { language: true },
      orderBy: { enrolledAt: "asc" },
    }),
    prisma.xPLog.aggregate({
      where: {
        userId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { amount: true },
    }),
  ]);

  const todayXp = todayXpAgg._sum.amount ?? 0;
  const levelInfo = getXpForNextLevel(user?.xpTotal ?? 0);
  const levelProgress = levelInfo.next > levelInfo.current
    ? ((user?.xpTotal ?? 0) - levelInfo.current) / (levelInfo.next - levelInfo.current)
    : 1;
  const dailyProgress = Math.min(todayXp / DAILY_GOAL_XP, 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.name ? `Hello, ${user.name.split(" ")[0]}! 👋` : "Welcome back! 👋"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Keep up your streak — every lesson counts.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-orange-500">{user?.currentStreak ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Day streak 🔥</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-emerald-600">{user?.xpTotal ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Total XP ⚡</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-500">{levelInfo.level}</div>
          <div className="text-xs text-gray-500 mt-1">Level 🎓</div>
        </div>
      </div>

      {/* Daily goal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-800">Today&apos;s goal</span>
          <span className="text-sm text-gray-500">{todayXp} / {DAILY_GOAL_XP} XP</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${dailyProgress * 100}%` }}
          />
        </div>
        {dailyProgress >= 1 && (
          <p className="text-xs text-emerald-600 mt-2 font-medium">🎉 Daily goal met!</p>
        )}
      </div>

      {/* Level progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-800">Level {levelInfo.level}</span>
          <span className="text-sm text-gray-500">{user?.xpTotal ?? 0} / {levelInfo.next} XP</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${levelProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Enrolled languages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Your languages</h2>
          <Link href="/languages" className="text-sm text-emerald-600 hover:underline">Browse all</Link>
        </div>
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t enrolled in a language yet</p>
            <Link href="/languages" className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors">
              Pick a language
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/languages/${e.language.slug}`}
                className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{e.language.flagEmoji ?? "🗣️"}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{e.language.name}</div>
                    <div className="text-xs text-gray-500">{e.language.nativeName} · {e.xpEarned} XP earned</div>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
