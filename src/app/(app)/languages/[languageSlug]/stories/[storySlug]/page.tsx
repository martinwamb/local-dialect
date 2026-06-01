import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StoryReader from "@/components/stories/StoryReader";
import { StoryPageRecord } from "@/types/story";

export default async function StoryReaderPage({
  params,
}: {
  params: Promise<{ languageSlug: string; storySlug: string }>;
}) {
  await auth();
  const { languageSlug, storySlug } = await params;

  const story = await prisma.story.findUnique({
    where: { slug: storySlug },
    include: {
      language: { select: { slug: true } },
      pages: { orderBy: { pageNumber: "asc" } },
    },
  });

  if (!story || story.language.slug !== languageSlug || !story.isPublished) notFound();

  const pages = story.pages.map(p => ({
    ...p,
    wordMap: (p.wordMap ?? null) as Record<string, string> | null,
  })) as unknown as StoryPageRecord[];

  const storyRecord = {
    id: story.id, languageId: story.languageId, unitId: story.unitId,
    title: story.title, slug: story.slug, description: story.description,
    coverEmoji: story.coverEmoji, sortOrder: story.sortOrder, isPublished: story.isPublished,
  };

  return (
    <StoryReader
      story={storyRecord}
      pages={pages}
      languageSlug={languageSlug}
    />
  );
}
