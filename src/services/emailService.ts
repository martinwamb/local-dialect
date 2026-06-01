import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mailer";
import { buildStreakReminderEmail, makeUnsubscribeUrl } from "@/lib/emailTemplates";

function todayUTCStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function sendDailyReminders(): Promise<{ sent: number; skipped: number; errors: number }> {
  const todayStart = todayUTCStart();

  // Find users who: haven't practised today, opted in, have an enrolled language
  const users = await prisma.user.findMany({
    where: {
      emailOptOut: false,
      email: { not: "" },
      userLanguages: { some: {} },
      OR: [
        { lastActiveAt: null },
        { lastActiveAt: { lt: todayStart } },
      ],
      // Exclude users who already got a reminder today
      NOT: {
        emailLogs: {
          some: {
            type: "streak_reminder",
            sentAt: { gte: todayStart },
          },
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      currentStreak: true,
      userLanguages: {
        take: 1,
        orderBy: { enrolledAt: "asc" },
        include: { language: { select: { name: true } } },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const from = process.env.SMTP_FROM ?? "Local Dialect <reminders@dialect.wambugumartin.com>";

  for (const user of users) {
    if (!user.email) { skipped++; continue; }
    const languageName = user.userLanguages[0]?.language.name ?? "Kikuyu";
    const unsubscribeUrl = makeUnsubscribeUrl(user.id);
    const { subject, html, text } = buildStreakReminderEmail({
      name: user.name,
      streak: user.currentStreak,
      languageName,
      unsubscribeUrl,
    });

    try {
      await transporter.sendMail({ from, to: user.email, subject, html, text });
      await prisma.emailLog.create({
        data: { userId: user.id, type: "streak_reminder", subject },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${user.email}:`, err);
      errors++;
    }
  }

  return { sent, skipped, errors };
}
