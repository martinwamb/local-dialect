import { NextResponse } from "next/server";
import { sendDailyReminders } from "@/services/emailService";

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await sendDailyReminders();
  return NextResponse.json(result);
}
