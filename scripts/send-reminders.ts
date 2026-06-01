import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import { createHmac } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function makeUnsubscribeToken(userId: string): string {
  return createHmac("sha256", process.env.UNSUBSCRIBE_SECRET ?? "dev")
    .update(userId)
    .digest("hex");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function todayUTCStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const todayStart = todayUTCStart();
  const appUrl = process.env.NEXTAUTH_URL ?? "https://dialect.wambugumartin.com";
  const from = process.env.SMTP_FROM ?? "Local Dialect <reminders@dialect.wambugumartin.com>";

  const users = await prisma.user.findMany({
    where: {
      emailOptOut: false,
      email: { not: "" },
      userLanguages: { some: {} },
      OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: todayStart } }],
      NOT: { emailLogs: { some: { type: "streak_reminder", sentAt: { gte: todayStart } } } },
    },
    select: {
      id: true, email: true, name: true, currentStreak: true,
      userLanguages: { take: 1, orderBy: { enrolledAt: "asc" }, include: { language: { select: { name: true } } } },
    },
  });

  let sent = 0, errors = 0;

  for (const user of users) {
    if (!user.email) continue;
    const languageName = user.userLanguages[0]?.language.name ?? "Kikuyu";
    const streak = user.currentStreak;
    const name = user.name ? user.name.split(" ")[0] : null;
    const greeting = name ? `Habari ${name}!` : "Habari!";
    const unsubscribeUrl = `${appUrl}/api/email/unsubscribe?userId=${user.id}&token=${makeUnsubscribeToken(user.id)}`;

    const subject = streak > 1
      ? `🔥 Keep your ${streak}-day streak alive — ${languageName} is waiting`
      : `🌍 Your ${languageName} journey continues today`;

    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
<div style="background:#059669;color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center;font-size:20px;font-weight:bold;">Local Dialect 🌍</div>
<div style="background:white;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
<p style="font-size:18px;font-weight:bold;color:#111827;">${greeting} 👋</p>
<p style="color:#6b7280;">Your <strong>${languageName}</strong> lesson awaits. ${streak > 1 ? `Protect your <strong style="color:#f97316;">${streak}-day streak!</strong>` : "Start your streak today!"}</p>
<div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:16px;text-align:center;margin:20px 0;">
<div style="font-size:40px;font-weight:bold;color:#f97316;">${streak}</div>
<div style="color:#9a3412;font-size:12px;text-transform:uppercase;font-weight:600;">Day Streak 🔥</div>
</div>
<div style="background:#ecfdf5;border-left:4px solid #059669;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
<em style="color:#065f46;">"Ũndũ mwega ũkagĩa na kĩhoto."</em><br>
<small style="color:#6b7280;">A good thing comes with patience. — Kikuyu proverb</small>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="${appUrl}/dashboard" style="background:#059669;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Continue Learning →</a>
</div>
<p style="color:#9ca3af;font-size:12px;text-align:center;">
<a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>
</p>
</div>
</div>`;

    try {
      await transporter.sendMail({ from, to: user.email, subject, html, text: `${greeting}\n\nContinue your ${languageName} lesson: ${appUrl}/dashboard\n\nUnsubscribe: ${unsubscribeUrl}` });
      await prisma.emailLog.create({ data: { userId: user.id, type: "streak_reminder", subject } });
      console.log(`✓ Sent to ${user.email}`);
      sent++;
    } catch (err) {
      console.error(`✗ Failed for ${user.email}:`, err);
      errors++;
    }
  }

  console.log(`\nDone: ${sent} sent, ${errors} errors, ${users.length - sent - errors} skipped`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().then(() => pool.end()));
