import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MembershipRole } from "@prisma/client";
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

const schema = z.object({
  organisationName: z.string().min(2),
  organisationSlug: z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
  ),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

async function getAvailableOrganisationSlug(candidate: string) {
  const baseSlug = slugify(candidate) || "contractor";
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.organisation.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

export async function POST(req: NextRequest) {
  const input = schema.parse(await req.json());
  const email = input.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const requestedSlug = input.organisationSlug && input.organisationSlug.length > 0 ? input.organisationSlug : input.organisationName;
  const organisationSlug = await getAvailableOrganisationSlug(requestedSlug);

  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    const organisation = await tx.organisation.create({
      data: {
        name: input.organisationName,
        slug: organisationSlug,
        onboardingComplete: false,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
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
