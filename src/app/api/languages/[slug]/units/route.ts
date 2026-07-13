import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { STAGE_ORDER } from "@/lib/constants";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const language = await prisma.language.findUnique({ where: { slug } });
  if (!language) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const units = await prisma.unit.findMany({
    where: { languageId: language.id },
    orderBy: { sortOrder: "asc" },
    include: {
      lessons: { orderBy: { sortOrder: "asc" } },
    },
  });

  const [completedLessonIds, userLanguage] = await Promise.all([
    prisma.lessonResult
      .findMany({ where: { userId: session.user.id }, select: { lessonId: true } })
      .then((rows) => new Set(rows.map((r) => r.lessonId))),
    prisma.userLanguage.findUnique({
      where: { userId_languageId: { userId: session.user.id, languageId: language.id } },
    }),
  ]);
  const unlockedStageOrder = STAGE_ORDER[userLanguage?.unlockedStage ?? "BEGINNER"];

  const unitsWithProgress = units.map((unit, ui) => {
    let prevCompleted = ui === 0;
    if (ui > 0) {
      const prevUnit = units[ui - 1];
      prevCompleted = prevUnit.lessons.every((l) => completedLessonIds.has(l.id));
    }
    // A unit is reachable either by finishing the previous one in sequence, or
    // by a placement quiz that unlocked its stage directly.
    const unitAccessible = prevCompleted || STAGE_ORDER[unit.stage] <= unlockedStageOrder;

    const lessons = unit.lessons.map((lesson, li) => {
      const isCompleted = completedLessonIds.has(lesson.id);
      const firstIncomplete = unit.lessons.findIndex((l) => !completedLessonIds.has(l.id));
      return {
        ...lesson,
        isCompleted,
        isLocked: !unitAccessible && li > firstIncomplete,
        isCurrent: !isCompleted && li === (firstIncomplete === -1 ? 0 : firstIncomplete),
      };
    });

    return { ...unit, lessons };
  });

  return NextResponse.json({ language, units: unitsWithProgress });
}
