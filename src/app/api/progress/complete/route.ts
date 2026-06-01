import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { completelesson } from "@/services/progressService";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, score, mistakeCount, durationSec } = await req.json();
  if (!lessonId || score === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const result = await completelesson(
      session.user.id,
      lessonId,
      score,
      mistakeCount ?? 0,
      durationSec
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to record progress" }, { status: 500 });
  }
}
