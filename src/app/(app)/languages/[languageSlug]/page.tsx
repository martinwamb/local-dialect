import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
};

export default async function LanguageUnitMapPage({
  params,
}: {
  params: Promise<{ languageSlug: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { languageSlug } = await params;

  const language = await prisma.language.findUnique({ where: { slug: languageSlug } });
  if (!language) notFound();

  const units = await prisma.unit.findMany({
    where: { languageId: language.id },
    orderBy: { sortOrder: "asc" },
    include: { lessons: { orderBy: { sortOrder: "asc" } } },
  });

  const completedLessonIds = new Set(
    (await prisma.lessonResult.findMany({
      where: { userId },
      select: { lessonId: true },
      distinct: ["lessonId"],
    })).map((r) => r.lessonId)
  );

  const enrollment = await prisma.userLanguage.findUnique({
    where: { userId_languageId: { userId, languageId: language.id } },
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{language.flagEmoji ?? "🗣️"}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{language.name}</h1>
          <p className="text-gray-500 text-sm">{language.nativeName} · {enrollment?.xpEarned ?? 0} XP earned</p>
        </div>
      </div>

      <div className="space-y-8">
        {units.map((unit, ui) => {
          const allPrevDone = ui === 0 || units.slice(0, ui).every((u) =>
            u.lessons.every((l) => completedLessonIds.has(l.id))
          );
          const unitDone = unit.lessons.every((l) => completedLessonIds.has(l.id));
          const bg = COLOR_MAP[unit.color ?? "emerald"] ?? "bg-emerald-500";

          return (
            <div key={unit.id}>
              {/* Unit header */}
              <div className={`rounded-2xl ${bg} text-white p-4 flex items-center gap-3 mb-3`}>
                <span className="text-2xl">{unit.iconEmoji ?? "📖"}</span>
                <div>
                  <div className="font-bold">Unit {unit.sortOrder}: {unit.title}</div>
                  {unit.description && (
                    <div className="text-xs opacity-80">{unit.description}</div>
                  )}
                </div>
                {unitDone && <span className="ml-auto text-xl">✅</span>}
              </div>

              {/* Lesson nodes */}
              <div className="flex flex-col items-center gap-2 pl-4">
                {unit.lessons.map((lesson, li) => {
                  const done = completedLessonIds.has(lesson.id);
                  const prevDone = li === 0
                    ? allPrevDone
                    : completedLessonIds.has(unit.lessons[li - 1].id);
                  const locked = !prevDone && !done;
                  const isCurrent = !done && prevDone;

                  return (
                    <Link
                      key={lesson.id}
                      href={locked ? "#" : `/learn/${languageSlug}/lesson/${lesson.id}`}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                        locked
                          ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                          : isCurrent
                          ? "bg-white border-emerald-300 shadow-sm ring-2 ring-emerald-200"
                          : done
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        done ? "bg-emerald-500 text-white"
                          : isCurrent ? "bg-emerald-600 text-white animate-pulse"
                          : locked ? "bg-gray-300 text-gray-500"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {done ? "✓" : locked ? "🔒" : lesson.sortOrder}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${locked ? "text-gray-400" : "text-gray-900"}`}>
                          {lesson.title}
                        </div>
                        {lesson.description && (
                          <div className="text-xs text-gray-400">{lesson.description}</div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{lesson.xpReward} XP</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
