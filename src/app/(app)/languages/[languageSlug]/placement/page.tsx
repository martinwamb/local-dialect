import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { buildPlacementSections } from "@/services/placementService";
import PlacementQuiz from "@/components/languages/PlacementQuiz";

export default async function PlacementPage({
  params,
}: {
  params: Promise<{ languageSlug: string }>;
}) {
  await auth();
  const { languageSlug } = await params;

  const language = await prisma.language.findUnique({ where: { slug: languageSlug } });
  if (!language || !language.isActive) notFound();

  const sections = await buildPlacementSections(language.id);

  return <PlacementQuiz languageSlug={languageSlug} sections={sections} />;
}
