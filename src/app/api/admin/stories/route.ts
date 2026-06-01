import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "martinwamb@gmail.com").split(",");

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, slug, languageSlug, unitSortOrder, coverEmoji, description, pages } = await req.json();

  if (!title || !slug || !languageSlug || !Array.isArray(pages)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const language = await prisma.language.findUnique({ where: { slug: languageSlug } });
  if (!language) return NextResponse.json({ error: "Language not found" }, { status: 404 });

  let unitId: string | undefined;
  if (unitSortOrder) {
    const unit = await prisma.unit.findFirst({
      where: { languageId: language.id, sortOrder: unitSortOrder },
    });
    unitId = unit?.id;
  }

  const story = await prisma.$transaction(async (tx) => {
    const s = await tx.story.upsert({
      where: { slug },
      update: { title, description, coverEmoji, isPublished: true },
      create: {
        title, slug, description, coverEmoji,
        languageId: language.id,
        unitId,
        isPublished: true,
      },
    });

    await tx.storyPage.deleteMany({ where: { storyId: s.id } });

    await tx.storyPage.createMany({
      data: pages.map((p: { sourceText: string; translatedText: string; audioUrl?: string; wordMap?: Record<string, string> }, idx: number) => ({
        storyId: s.id,
        pageNumber: idx + 1,
        sourceText: p.sourceText,
        translatedText: p.translatedText,
        audioUrl: p.audioUrl ?? null,
        wordMap: p.wordMap ? (p.wordMap as unknown as import("@/generated/prisma/client").Prisma.InputJsonValue) : undefined,
      })),
    });

    return s;
  });

  return NextResponse.json(story, { status: 201 });
}
