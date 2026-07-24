import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: "postgresql://postgres:1tsh0cein!1@localhost:5432/studivo_local_v2",
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

async function cleanup() {
  console.log("Starting cleanup of duplicate seat assignments...");

  const activeAssignments = await prisma.seatAssignment.findMany({
    where: {
      OR: [
        { endsAt: null },
        { endsAt: { gt: new Date() } }
      ],
      membership: {
        status: { in: ["ACTIVE", "PENDING"] }
      }
    },
    include: {
      membership: {
        include: {
          user: true
        }
      },
      seat: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const userAssignments = new Map<string, typeof activeAssignments>();

  for (const assignment of activeAssignments) {
    const userId = assignment.membership.userId;
    const existing = userAssignments.get(userId) || [];
    userAssignments.set(userId, [...existing, assignment]);
  }

  let fixedCount = 0;

  for (const [userId, assignments] of userAssignments.entries()) {
    if (assignments.length > 1) {
      const userName = assignments[0].membership.user.name;
      console.log(`Found ${assignments.length} active assignments for user ${userName} (${userId})`);
      
      // Keep the most recent one, close others
      const [keep, ...toClose] = assignments;
      console.log(`Keeping assignment ${keep.id} (Seat ${keep.seat.number})`);

      for (const assignment of toClose) {
        console.log(`Closing assignment ${assignment.id} (Seat ${assignment.seat.number})`);
        await prisma.seatAssignment.update({
          where: { id: assignment.id },
          data: { endsAt: new Date() }
        });
        fixedCount++;
      }
    }
  }

  console.log(`Cleanup finished. Fixed ${fixedCount} duplicate assignments.`);
}

cleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
