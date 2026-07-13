import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ExerciseFlow, { IntroScreen } from "@/components/exercises/ExerciseFlow";
import { ExerciseRecord } from "@/types/exercise";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ languageSlug: string; lessonId: string }>;
}) {
  await auth();
  const { languageSlug, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      exercises: { orderBy: { sortOrder: "asc" } },
      unit: { include: { language: true } },
    },
  });

  if (!lesson || lesson.unit.language.slug !== languageSlug) notFound();

  const exercises = shuffle(lesson.exercises) as unknown as ExerciseRecord[];
  const introContent = lesson.introContent as unknown as IntroScreen[] | undefined;

  return (
    <ExerciseFlow
      exercises={exercises}
      introContent={introContent ?? undefined}
      lesson={{ id: lesson.id, title: lesson.title, xpReward: lesson.xpReward }}
      languageSlug={languageSlug}
    />
  );
}
