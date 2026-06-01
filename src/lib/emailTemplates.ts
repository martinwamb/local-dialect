import { createHmac } from "crypto";

export function makeUnsubscribeToken(userId: string): string {
  return createHmac("sha256", process.env.UNSUBSCRIBE_SECRET ?? "dev")
    .update(userId)
    .digest("hex");
}

export function makeUnsubscribeUrl(userId: string): string {
  const token = makeUnsubscribeToken(userId);
  const base = process.env.NEXTAUTH_URL ?? "https://dialect.wambugumartin.com";
  return `${base}/api/email/unsubscribe?userId=${userId}&token=${token}`;
}

interface StreakReminderOpts {
  name: string | null;
  streak: number;
  languageName: string;
  unsubscribeUrl: string;
}

export function buildStreakReminderEmail(opts: StreakReminderOpts): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, streak, languageName, unsubscribeUrl } = opts;
  const greeting = name ? `Habari ${name.split(" ")[0]}!` : "Habari!";
  const appUrl = process.env.NEXTAUTH_URL ?? "https://dialect.wambugumartin.com";

  const subject =
    streak > 1
      ? `🔥 Keep your ${streak}-day streak alive — ${languageName} is waiting`
      : `🌍 Your ${languageName} journey continues today`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <!-- Header -->
      <tr><td style="background:#059669;padding:24px;text-align:center;">
        <div style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.3px;">Local Dialect 🌍</div>
        <div style="color:#a7f3d0;font-size:13px;margin-top:4px;">Learn Kenyan Languages</div>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:32px 28px;">
        <p style="font-size:20px;font-weight:bold;color:#111827;margin:0 0 8px;">${greeting} 👋</p>
        <p style="color:#6b7280;font-size:15px;margin:0 0 24px;line-height:1.5;">
          Your <strong style="color:#111827;">${languageName}</strong> lesson is waiting.
          ${streak > 1 ? `You have a <strong style="color:#f97316;">${streak}-day streak</strong> to protect!` : "Start your streak today — every day counts!"}
        </p>
        <!-- Streak badge -->
        <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
          <div style="font-size:44px;font-weight:bold;color:#f97316;line-height:1;">${streak}</div>
          <div style="color:#9a3412;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Day Streak 🔥</div>
        </div>
        <!-- Kikuyu phrase -->
        <div style="background:#ecfdf5;border-left:4px solid #059669;padding:12px 16px;margin-bottom:28px;border-radius:0 8px 8px 0;">
          <div style="font-style:italic;color:#065f46;font-size:14px;line-height:1.5;">&ldquo;Ũndũ mwega ũkagĩa na kĩhoto.&rdquo;</div>
          <div style="color:#6b7280;font-size:12px;margin-top:4px;">A good thing comes with patience. — Kikuyu proverb</div>
        </div>
        <!-- CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${appUrl}/dashboard"
             style="display:inline-block;background:#059669;color:#ffffff;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:12px;text-decoration:none;">
            Continue Learning &rarr;
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.5;">
          Just 5 minutes a day makes a big difference. See you inside!
        </p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:11px;margin:0;line-height:1.6;">
          You&rsquo;re receiving this because you enrolled in Local Dialect.<br>
          <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe from reminders</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `${greeting}

Your ${languageName} lesson is waiting. ${streak > 1 ? `Keep your ${streak}-day streak alive!` : "Start your streak today!"}

"Ũndũ mwega ũkagĩa na kĩhoto." — A good thing comes with patience.

Continue learning: ${appUrl}/dashboard

---
Unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}
