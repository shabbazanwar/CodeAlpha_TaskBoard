import { hash } from "bcryptjs";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";

const INVALID_LINK = "This reset link is invalid or has expired. Request a new one.";
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Looks a token up and returns it only if it is unused and unexpired. */
async function findUsableToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

/** GET /api/auth/reset-password?token=… — lets the page show a bad link up front. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const usable = token.length >= 20 ? await findUsableToken(token) : null;
  return NextResponse.json({ valid: Boolean(usable) });
}

/** POST /api/auth/reset-password — set a new password with a valid token. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const record = await findUsableToken(parsed.data.token);
  if (!record) return apiError(INVALID_LINK, 400);

  const passwordHash = await hash(parsed.data.password, 10);

  // Consume the token and change the password together, and retire every other
  // outstanding link for this account.
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
