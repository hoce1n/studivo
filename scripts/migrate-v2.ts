import { PrismaClient as PrismaClientV1 } from '@/lib/generated/prisma-old/client';
import { PrismaClient as PrismaClientV2 } from '@/lib/generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prismaV1: PrismaClientV1;
  prismaV2: PrismaClientV2;
};

// Adapter for old database (v1)
const adapterV1 = new PrismaPg({
  connectionString: "postgresql://postgres:1tsh0cein!1@localhost:5432/studivo_local_v1",
});

// Adapter for new database (v2)
const adapterV2 = new PrismaPg({
  connectionString: "postgresql://postgres:1tsh0cein!1@localhost:5432/studivo_local_v2",
});

// Prisma Client for reading from old database
export const prisma_V1 = globalForPrisma.prismaV1 ?? new PrismaClientV1({ adapter: adapterV1 });
if (process.env.NODE_ENV !== "production") globalForPrisma.prismaV1 = prisma_V1;

// Prisma Client for writing to new database
export const prisma_V2 = globalForPrisma.prismaV2 ?? new PrismaClientV2({ adapter: adapterV2 });
if (process.env.NODE_ENV !== "production") globalForPrisma.prismaV2 = prisma_V2;

async function main() {
  console.log("🚀 Starting data migration from v1 to v2...");

  try {
    // 1. Migrate StudyHalls + Create default Sections and Membership Plans
    const oldStudyHalls = await prisma_V1.studyHall.findMany();
    console.log(`📊 Found ${oldStudyHalls.length} study halls.`);

    for (const old of oldStudyHalls) {
      await prisma_V2.$transaction(async (tx) => {
        const gender: 'MALE' | 'FEMALE' = 
          old.gender?.toLowerCase().includes('خانم') || old.gender === 'female' 
            ? 'FEMALE' : 'MALE';

        await tx.studyHall.create({
          data: {
            id: old.id,
            name: old.name,
            slug: old.slug || `hall-${old.id}`,
            gender,
            address: old.address || '',
            isActive: true,
            publicPageEnabled: old.publicPageEnabled ?? false,
            heroImage: old.heroImage,
            galleryImages: old.galleryImages ?? [],
          }
        });

        // Create default section
        await tx.section.create({
          data: {
            studyHallId: old.id,
            name: "Main Hall",
            description: "Migrated from previous version",
            isActive: true,
          }
        });

        // Create default membership plan
        await tx.membershipPlan.create({
          data: {
            studyHallId: old.id,
            name: "Default Monthly Plan",
            durationDays: 30,
            price: old.monthlyFee ? old.monthlyFee : 0,
            hasFixedSeat: true,
            isActive: true,
          }
        });
      });
    }

    console.log("✅ Study halls, sections, and membership plans migrated successfully.");

    // 2. Migrate Users + Staff Assignments
    const oldUsers = await prisma_V1.user.findMany();
    console.log(`📊 Found ${oldUsers.length} users.`);

    for (const old of oldUsers) {
      await prisma_V2.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: old.id,
            name: old.name,
            email: old.email,
            emailVerified: old.emailVerified ?? false,
            image: old.image,
            phoneNumber: old.phoneNumber,
            platformRole: old.platformRole,
          }
        });

        // Create staff assignment for admins/staff
        if ((old.role === 'admin' || old.role === 'staff') && old.studyhallId) {
          await tx.staffAssignment.create({
            data: {
              userId: old.id,
              studyHallId: old.studyhallId,
              role: old.role === 'admin' ? 'OWNER' : 'STAFF',
              startDate: old.createdAt,
              isActive: true,
            }
          });
        }
      });
    }

    console.log("✅ Users and staff assignments migrated successfully.");

    // 3. Migrate Seats
    const oldSeats = await prisma_V1.seat.findMany();
    for (const old of oldSeats) {
      const section = await prisma_V2.section.findFirst({
        where: { studyHallId: old.studyhallId, name: "Main Hall" }
      });

      if (section) {
        await prisma_V2.seat.create({
          data: {
            id: old.id,
            sectionId: section.id,
            number: old.seatNumber.toString(),
            isActive: true,
          }
        });
      }
    }

    console.log("✅ Seats migrated successfully.");

    // 4. Migrate Subscriptions → Membership + SeatAssignment + Payment
    const oldSubscriptions = await prisma_V1.subscription.findMany();
    console.log(`📊 Found ${oldSubscriptions.length} subscriptions to convert.`);

    for (const old of oldSubscriptions) {
      await prisma_V2.$transaction(async (tx) => {
        const plan = await tx.membershipPlan.findFirst({
          where: { studyHallId: old.studyhallId }
        });

        if (!plan) {
          console.warn(`⚠️ No plan found for subscription ${old.id}`);
          return;
        }

        const membership = await tx.membership.create({
          data: {
            id: old.id,
            userId: old.userId,
            studyHallId: old.studyhallId,
            membershipPlanId: plan.id,
            status: old.status === 'active' ? 'ACTIVE' : 
                   old.status === 'expired' ? 'EXPIRED' : 'CANCELLED',
            startsAt: old.startDate,
            endsAt: old.endDate,
            planName: plan.name,
            planDurationDays: plan.durationDays,
            planPrice: old.monthlyFeeAtSubscription ?? plan.price,
            hasFixedSeat: true,
          }
        });

        if (old.seatId) {
          await tx.seatAssignment.create({
            data: {
              membershipId: membership.id,
              seatId: old.seatId,
              startsAt: old.startDate,
              endsAt: old.endDate,
            }
          });
        }

        const owner = await tx.staffAssignment.findFirst({
          where: { studyHallId: old.studyhallId, role: 'OWNER' }
        });

        await tx.payment.create({
          data: {
            membershipId: membership.id,
            amount: old.monthlyFeeAtSubscription ?? plan.price,
            method: 'CASH',
            status: old.paymentStatus === 'paid' ? 'COMPLETED' : 'PENDING',
            paidAt: old.paymentDate,
            createdById: owner?.userId || old.userId,
          }
        });
      });
    }

    console.log("🎉 Data migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await prisma_V1.$disconnect();
    await prisma_V2.$disconnect();
  }
}

main();