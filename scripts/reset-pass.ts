/**
 * Dev utility: reset a user's email/password credential via Better Auth's hasher.
 *
 * Usage:
 *   npx tsx scripts/reset-pass.ts
 *   npx tsx scripts/reset-pass.ts user@example.com 'new-password'
 *
 * Requires DATABASE_URL in .env (same as the app).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { prisma } from "@/lib/db";

const DEFAULT_EMAIL = "Piraayesh@studivo.ir";
const DEFAULT_PASSWORD = "S4njesh_";

async function resetPassword() {
  const email = (process.argv[2] ?? DEFAULT_EMAIL).trim().toLowerCase();
  const newPassword = process.argv[3] ?? DEFAULT_PASSWORD;

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing. Load it from .env before running.");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("❌ Password must be at least 8 characters.");
    process.exit(1);
  }

  console.log(`⏳ Resetting password for: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    console.error("❌ User not found. Check the email / database.");
    process.exit(1);
  }

  // Better Auth email/password accounts use providerId "credential"
  // and store the scrypt hash in Account.password (see sign-up route).
  const hashed = await hashPassword(newPassword);

  const account = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed },
    });
    console.log(`✅ Updated credential account (${account.id}).`);
  } else {
    const created = await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashed,
      },
    });
    console.log(`✅ Created credential account (${created.id}).`);
  }

  // Force re-login after a password reset.
  const { count } = await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  if (count > 0) {
    console.log(`🧹 Cleared ${count} existing session(s).`);
  }

  console.log(`✅ Password ready for ${user.email} (${user.name}).`);
  console.log(`   Login with password: ${newPassword}`);
}

resetPassword()
  .catch((error) => {
    console.error("❌ Failed to reset password:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
