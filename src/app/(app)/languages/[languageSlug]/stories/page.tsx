import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ languageSlug: string }>;
}) {
  await auth();
  const { languageSlug } = await params;

  const language = await prisma.language.findUnique({ where: { slug: languageSlug } });
  if (!language) notFound();

  const stories = await prisma.story.findMany({
    where: { languageId: language.id, isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: { unit: { select: { title: true } }, _count: { select: { pages: true } } },
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/languages/${languageSlug}`} className="text-gray-400 hover:text-gray-700 text-sm transition-colors">
          ← Unit map
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Stories</h1>
      <p className="text-gray-500 text-sm mb-6">
        Read short {language.name} stories with word-by-word translations.
      </p>

      {stories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">📖</div>
          <p className="text-gray-500">Stories are coming soon for {language.name}!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/languages/${languageSlug}/stories/${story.slug}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-emerald-200 transition-colors"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                {story.coverEmoji ?? "📖"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{story.title}</div>
                {story.description && (
                  <div className="text-sm text-gray-500 truncate">{story.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {story._count.pages} pages
                  {story.unit && ` · ${story.unit.title}`}
                </div>
              </div>
              <span className="text-emerald-600 font-bold shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
