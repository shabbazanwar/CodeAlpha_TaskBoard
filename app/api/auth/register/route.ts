import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("An account with that email already exists", 409);
  }

  const passwordHash = await hash(parsed.data.password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, name: parsed.data.name, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    // Unique constraint — two requests raced past the check above.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return apiError("An account with that email already exists", 409);
    }
    throw error;
  }
}
