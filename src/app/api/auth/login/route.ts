import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { comparePassword, signSession, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  organisationSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const input = schema.parse(await req.json());
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: {
      memberships: {
        include: { organisation: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  let membership = user.memberships.find((item) => item.isPrimary) ?? user.memberships[0] ?? null;
  if (input.organisationSlug) {
    membership =
      user.memberships.find((item) => item.organisation.slug === input.organisationSlug) ?? membership;
  }

  const token = signSession({
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    organisationId: membership?.organisationId,
    role: membership?.role,
    platformRole: user.platformRole,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      platformRole: user.platformRole,
      role: membership?.role ?? null,
      organisation: membership?.organisation ?? null,
    },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
