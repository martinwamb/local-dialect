import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  if (!userId || !token) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400, headers: { "Content-Type": "text/html" } });
  }

  const expected = createHmac("sha256", process.env.UNSUBSCRIBE_SECRET ?? "dev")
    .update(userId)
    .digest("hex");

  if (expected !== token) {
    return new NextResponse("Invalid or expired unsubscribe link.", { status: 403, headers: { "Content-Type": "text/html" } });
  }

  await prisma.user.update({ where: { id: userId }, data: { emailOptOut: true } });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Unsubscribed</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;}
.card{background:white;border-radius:16px;padding:40px;max-width:400px;text-align:center;border:1px solid #e5e7eb;}
h1{color:#111827;font-size:22px;}p{color:#6b7280;font-size:14px;}a{color:#059669;}</style>
</head><body><div class="card">
<div style="font-size:48px;">✅</div>
<h1>You've been unsubscribed</h1>
<p>You won't receive daily reminder emails from Local Dialect anymore.</p>
<p>You can re-enable reminders anytime from your <a href="${process.env.NEXTAUTH_URL ?? "https://dialect.wambugumartin.com"}/profile">profile page</a>.</p>
</div></body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
