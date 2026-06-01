import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPhonetics } from "@/lib/ollama";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");
  const language = searchParams.get("language") ?? "Kikuyu";

  if (!word) return NextResponse.json({ error: "Missing word" }, { status: 400 });

  const result = await getPhonetics(word, language);
  if (!result) return NextResponse.json({ error: "Could not generate phonetics" }, { status: 500 });

  return NextResponse.json(result);
}
