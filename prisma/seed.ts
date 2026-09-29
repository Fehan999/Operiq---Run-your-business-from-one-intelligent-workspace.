import { createHash, randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import { PrismaClient, type MemberRole } from "../src/generated/prisma/client";

/*
 * Seeds a demo workspace, "Nova Digital Agency", with a small team and some history.
 *
 * Teammates are placeholder accounts on the reserved .example domain; they can't sign in.
 * To explore the workspace yourself, sign up once in the app and run:
 *
 *   SEED_OWNER_EMAIL=you@yourdomain.com npm run db:seed
 *
 * and your account is added as the owner. Running the seed twice is safe.
 */

loadEnv({ path: [".env.local", ".env"], quiet: true });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL before seeding.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const WORKSPACE = { name: "Nova Digital Agency", slug: "nova-digital" };

const TEAM: Array<{ name: string; email: string; role: MemberRole; jobTitle: string }> = [
  {
    name: "Sara Khan",
    email: "sara@novadigital.example",
    role: "ADMIN",
    jobTitle: "Operations lead",
  },
  {
    name: "Liam Chen",
    email: "liam@novadigital.example",
    role: "MANAGER",
    jobTitle: "Project manager",
  },
  {
    name: "Aisha Rahman",
    email: "aisha@novadigital.example",
    role: "MEMBER",
    jobTitle: "Account executive",
  },
  {
    name: "Diego Alvarez",
    email: "diego@novadigital.example",
    role: "VIEWER",
    jobTitle: "Freelance designer",
  },
];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function upsertPlaceholderUser(name: string, email: string) {
  return db.user.upsert({
    where: { email },
    update: {},
    create: { name, email, firebaseUid: `seed:${email}`, emailVerifiedAt: new Date() },
  });
}

async function main() {
  const existing = await db.organization.findUnique({ where: { slug: WORKSPACE.slug } });
  if (existing) {
    console.log(`"${WORKSPACE.name}" already exists, nothing to do.`);
    return;
  }

  const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  const realOwner = ownerEmail ? await db.user.findUnique({ where: { email: ownerEmail } }) : null;
  if (ownerEmail && !realOwner) {
    console.warn(`No account for ${ownerEmail} yet. Sign up in the app first, then seed again.`);
  }
  const owner =
    realOwner ?? (await upsertPlaceholderUser("Nova Owner", "owner@novadigital.example"));

  const organization = await db.organization.create({
    data: {
      ...WORKSPACE,
      industry: "agency",
      companySize: "SIZE_2_10",
      currency: "USD",
      timezone: "Asia/Dhaka",
      website: "https://novadigital.example",
      goals: ["win-more-deals", "deliver-projects", "get-paid-faster", "use-ai"],
      plan: "PRO",
      onboardingStep: "COMPLETED",
      onboardingCompletedAt: daysAgo(30),
      createdAt: daysAgo(30),
      members: {
        create: { userId: owner.id, role: "OWNER", jobTitle: "Founder", createdAt: daysAgo(30) },
      },
    },
  });

  await db.activity.create({
    data: {
      organizationId: organization.id,
      actorId: owner.id,
      type: "workspace.created",
      data: { name: organization.name },
      createdAt: daysAgo(30),
    },
  });

  for (const [index, person] of TEAM.entries()) {
    const user = await upsertPlaceholderUser(person.name, person.email);
    const joinedAt = daysAgo(28 - index * 5);
    await db.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: person.role,
        jobTitle: person.jobTitle,
        createdAt: joinedAt,
      },
    });
    await db.activity.createMany({
      data: [
        {
          organizationId: organization.id,
          actorId: owner.id,
          type: "member.invited",
          data: { email: person.email, role: person.role },
          createdAt: new Date(joinedAt.getTime() - 60 * 60 * 1000),
        },
        {
          organizationId: organization.id,
          actorId: user.id,
          type: "member.joined",
          data: { role: person.role },
          createdAt: joinedAt,
        },
      ],
    });
    await db.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: user.id,
        action: "invitation.accepted",
        metadata: { role: person.role },
        createdAt: joinedAt,
      },
    });
  }

  await db.invitation.create({
    data: {
      organizationId: organization.id,
      email: "maria@novadigital.example",
      role: "MEMBER",
      // Nobody holds the raw token, so this invitation can never be accepted. It only fills the list.
      tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"),
      invitedById: owner.id,
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
    },
  });

  await db.notification.create({
    data: {
      organizationId: organization.id,
      recipientId: owner.id,
      type: "invitation.accepted",
      title: "Diego Alvarez joined Nova Digital Agency",
      link: `/w/${organization.slug}/settings/members`,
      createdAt: daysAgo(8),
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: organization.id,
      actorId: owner.id,
      action: "workspace.created",
      targetType: "organization",
      targetId: organization.id,
      createdAt: daysAgo(30),
    },
  });

  console.log(
    `Seeded "${organization.name}" at /w/${organization.slug}/dashboard (owner: ${owner.email}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
