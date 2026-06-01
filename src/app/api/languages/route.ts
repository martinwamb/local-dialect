import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const languages = await prisma.language.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(languages);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { languageId } = await req.json();
  if (!languageId) return NextResponse.json({ error: "Missing languageId" }, { status: 400 });

  const existing = await prisma.userLanguage.findUnique({
    where: { userId_languageId: { userId: session.user.id, languageId } },
  });
  if (existing) return NextResponse.json(existing);

  const enrollment = await prisma.userLanguage.create({
    data: { userId: session.user.id, languageId },
  });
  return NextResponse.json(enrollment, { status: 201 });
}
