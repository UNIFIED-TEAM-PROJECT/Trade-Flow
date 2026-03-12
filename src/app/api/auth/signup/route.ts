import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MembershipRole } from "@prisma/client";
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  organisationName: z.string().min(2),
  organisationSlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const input = schema.parse(await req.json());

  const existingUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const slugExists = await prisma.organisation.findUnique({ where: { slug: input.organisationSlug } });
  if (slugExists) {
    return NextResponse.json({ error: "Organisation slug already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    const organisation = await tx.organisation.create({
      data: {
        name: input.organisationName,
        slug: input.organisationSlug,
        onboardingComplete: false,
      },
    });

    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    const membership = await tx.membership.create({
      data: {
        organisationId: organisation.id,
        userId: user.id,
        role: MembershipRole.OWNER,
        isPrimary: true,
      },
    });

    await tx.contractorBranding.create({
      data: {
        organisationId: organisation.id,
        companyName: input.organisationName,
        logoPath: "/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-dark.svg",
      },
    });

    return { organisation, user, membership };
  });

  const token = signSession({
    userId: result.user.id,
    email: result.user.email,
    firstName: result.user.firstName,
    lastName: result.user.lastName,
    organisationId: result.membership.organisationId,
    role: result.membership.role,
    platformRole: result.user.platformRole,
  });

  const response = NextResponse.json({ ok: true, organisation: result.organisation, user: result.user });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
