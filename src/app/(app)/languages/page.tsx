import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LanguageEnrollCard from "@/components/languages/LanguageEnrollCard";

export default async function LanguagesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [languages, enrollments] = await Promise.all([
    prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.userLanguage.findMany({ where: { userId }, select: { languageId: true } }),
  ]);

  const enrolledIds = new Set(enrollments.map((e) => e.languageId));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose a language</h1>
      <p className="text-gray-500 text-sm mb-6">Pick a Kenyan language to start learning today.</p>

      <div className="space-y-4">
        {languages.map((lang) => (
          <LanguageEnrollCard
            key={lang.id}
            language={lang}
            isEnrolled={enrolledIds.has(lang.id)}
          />
        ))}
      </div>

      {languages.filter((l) => !l.isActive).length > 0 && (
        <p className="text-center text-sm text-gray-400 mt-8">
          More languages coming soon. Follow us for updates!
        </p>
      )}
    </div>
  );
}
