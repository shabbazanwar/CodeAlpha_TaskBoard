import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api";
import { sendPasswordResetEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 60 * 1000; // one email per address per minute

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * POST /api/auth/forgot-password — email a reset link.
 *
 * Always answers 200 with the same body whether or not the address has an
 * account, so this endpoint cannot be used to discover who is registered.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const generic = NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return generic;

  // Throttle: a recent unused link already exists, so do not send another.
  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) return generic;

  const token = randomBytes(32).toString("base64url");

  // Only the newest link works: drop any earlier unused ones.
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    }),
  ]);

  // Build the link from configured config, never from request headers, so a
  // forged Host header cannot point the email at an attacker's site.
  const base = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
  const link = `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, link);
  } catch (error) {
    // Do not reveal delivery problems to the caller; log for the operator.
    console.error("Password reset email failed:", error instanceof Error ? error.message : error);
  }

  return generic;
}
