/**
 * Transactional email. Uses Resend's HTTP API (no SDK dependency). Configure:
 *   RESEND_API_KEY  — from https://resend.com/api-keys
 *   MAIL_FROM       — e.g. "TaskBoard <no-reply@yourdomain.com>" (a domain verified in Resend)
 *
 * Without RESEND_API_KEY nothing is sent. In development the message is printed to
 * the server console so the flow can be tried locally. In production the link is
 * deliberately NOT logged, because a reset link is a credential.
 */

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export async function sendPasswordResetEmail(to: string, name: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[mail] Password reset for ${to}\n[mail] ${link}\n`);
    } else {
      console.warn("[mail] RESEND_API_KEY is not set; password reset email was not sent");
    }
    return;
  }

  const firstName = escapeHtml(name.trim().split(/\s+/)[0] || "there");
  const safeLink = escapeHtml(link);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? "TaskBoard <onboarding@resend.dev>",
      to,
      subject: "Reset your TaskBoard password",
      text: `Hi ${name.trim() || "there"},\n\nUse this link to choose a new password (it expires in 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email. Your password won't change.`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#0f1a2c">
  <h2 style="margin:0 0 12px">Reset your password</h2>
  <p>Hi ${firstName},</p>
  <p>Use the button below to choose a new password. The link expires in 1 hour and can only be used once.</p>
  <p style="margin:24px 0"><a href="${safeLink}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;display:inline-block">Choose a new password</a></p>
  <p style="color:#5c6a82;font-size:13px">If the button doesn't work, paste this into your browser:<br>${safeLink}</p>
  <p style="color:#5c6a82;font-size:13px">If you didn't ask for this, you can ignore this email. Your password won't change.</p>
</div>`,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
}
