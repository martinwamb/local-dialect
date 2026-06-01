import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function LessonIntroPage({
  params,
}: {
  params: Promise<{ languageSlug: string; lessonId: string }>;
}) {
  await auth();
  const { languageSlug, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: { include: { language: true } },
      _count: { select: { exercises: true } },
    },
  });

  if (!lesson || lesson.unit.language.slug !== languageSlug) notFound();

  const typeLabel = lesson.type === "REVIEW" ? "Review lesson" : lesson.type === "CHALLENGE" ? "Challenge" : "Lesson";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-5xl mb-4">
          {lesson.type === "REVIEW" ? "🔄" : lesson.type === "CHALLENGE" ? "⚡" : "📖"}
        </div>
        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
          {lesson.unit.language.name} · Unit {lesson.unit.sortOrder}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-gray-500 text-sm mb-4">{lesson.description}</p>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
          <span>{lesson._count.exercises} exercises</span>
          <span>·</span>
          <span className="text-emerald-600 font-semibold">+{lesson.xpReward} XP</span>
          <span>·</span>
          <span>{typeLabel}</span>
        </div>
        <Link
          href={`/learn/${languageSlug}/lesson/${lessonId}/exercise`}
          className="block w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors"
        >
          Start lesson →
        </Link>
        <Link
          href={`/languages/${languageSlug}`}
          className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to unit map
        </Link>
      </div>
    </div>
  );
}
