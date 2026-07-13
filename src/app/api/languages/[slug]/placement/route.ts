import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { scorePlacement, type Stage } from "@/services/placementService";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const language = await prisma.language.findUnique({ where: { slug } });
  if (!language) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { results } = (await req.json()) as { results: { exerciseId: string; stage: Stage; correct: boolean }[] };
  if (!Array.isArray(results)) return NextResponse.json({ error: "Missing results" }, { status: 400 });

  const unlockedStage = scorePlacement(results);

  await prisma.userLanguage.upsert({
    where: { userId_languageId: { userId: session.user.id, languageId: language.id } },
    create: { userId: session.user.id, languageId: language.id, unlockedStage },
    update: { unlockedStage },
  });

  return NextResponse.json({ unlockedStage });
}
