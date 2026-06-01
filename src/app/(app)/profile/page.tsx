import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getXpForNextLevel } from "@/lib/constants";
import { signOut } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, userBadges, allBadges, enrollments, totalResults] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, xpTotal: true, currentStreak: true, longestStreak: true, createdAt: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.badge.findMany({ orderBy: { name: "asc" } }),
    prisma.userLanguage.findMany({ where: { userId }, include: { language: true } }),
    prisma.lessonResult.count({ where: { userId } }),
  ]);

  if (!user) return null;
  const levelInfo = getXpForNextLevel(user.xpTotal);
  const earnedIds = new Set(userBadges.map((ub) => ub.badgeId));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
          {(user.name ?? user.email ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.name ?? "Learner"}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400">Member since {new Date(user.createdAt).toLocaleDateString("en-KE", { year: "numeric", month: "long" })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total XP", value: user.xpTotal, emoji: "⚡" },
          { label: "Level", value: levelInfo.level, emoji: "🎓" },
          { label: "Best streak", value: `${user.longestStreak}d`, emoji: "🔥" },
          { label: "Lessons done", value: totalResults, emoji: "📚" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.emoji} {s.label}</div>
          </div>
        ))}
      </div>

      {/* Languages */}
      {enrollments.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Language progress</h2>
          <div className="space-y-2">
            {enrollments.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">{e.language.flagEmoji ?? "🗣️"}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{e.language.name}</div>
                  <div className="text-xs text-gray-500">{e.xpEarned} XP · {e.lessonsCompleted} lessons</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">
          Badges ({userBadges.length}/{allBadges.length})
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {allBadges.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                title={badge.description}
                className={`rounded-2xl border p-3 flex flex-col items-center gap-2 text-center transition-all ${
                  earned ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-100 opacity-40"
                }`}
              >
                <div className="text-3xl">{earned ? "🏅" : "🔒"}</div>
                <div className="text-xs font-medium text-gray-700 leading-tight">{badge.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <form action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}>
        <button type="submit" className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Sign out
        </button>
      </form>
    </div>
  );
}
