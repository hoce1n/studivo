import { prisma } from "@/lib/db";

type LegacyTenantRole = "admin" | "staff";
export type LegacyUserRole = LegacyTenantRole | "member";
type HallRole = "OWNER" | "STAFF";

type TenantStudyHallContext = {
  id: string;
  name: string;
  totalSeats: number;
  monthlyFee: number;
  gender: "male" | "female";
  address: string;
  slug: string;
};

export type TenantContext = {
  staffAssignmentId: string;
  studyhallId: string;
  studyHallId: string;
  hallRole: HallRole;
  role: LegacyTenantRole;
  studyhall: TenantStudyHallContext;
  studyHall: TenantStudyHallContext;
};

export type TenantPrincipal = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  platformRole: "SUPER_ADMIN" | "SALES" | null;
  image: string | null;
  role: LegacyUserRole;
} & Omit<Partial<TenantContext>, "role">;

function mapHallRoleToLegacyRole(role: HallRole): LegacyTenantRole {
  return role === "OWNER" ? "admin" : "staff";
}

function mapGenderToLegacy(gender: "MALE" | "FEMALE"): "male" | "female" {
  return gender === "MALE" ? "male" : "female";
}

function decimalToNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

export function isTenantOwner(user: Pick<TenantPrincipal, "hallRole" | "role">) {
  return user.hallRole === "OWNER" || user.role === "admin";
}

export async function getTenantContext(userId: string): Promise<TenantContext | null> {
  const now = new Date();
  const assignment = await prisma.staffAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    orderBy: [{ role: "asc" }, { startDate: "asc" }],
    select: {
      id: true,
      studyHallId: true,
      role: true,
      studyHall: {
        select: {
          id: true,
          name: true,
          gender: true,
          address: true,
          slug: true,
          sections: {
            where: { isActive: true },
            select: { _count: { select: { seats: true } } },
          },
          membershipPlans: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { price: true },
          },
        },
      },
    },
  });

  if (!assignment) return null;

  const totalSeats = assignment.studyHall.sections.reduce(
    (sum: number, section: { _count: { seats: number } }) => sum + section._count.seats,
    0
  );
  const monthlyFee = decimalToNumber(assignment.studyHall.membershipPlans[0]?.price ?? 0);
  const studyhall = {
    id: assignment.studyHall.id,
    name: assignment.studyHall.name,
    totalSeats,
    monthlyFee,
    gender: mapGenderToLegacy(assignment.studyHall.gender),
    address: assignment.studyHall.address ?? "",
    slug: assignment.studyHall.slug,
  } satisfies TenantStudyHallContext;

  return {
    staffAssignmentId: assignment.id,
    studyhallId: assignment.studyHallId,
    studyHallId: assignment.studyHallId,
    hallRole: assignment.role,
    role: mapHallRoleToLegacyRole(assignment.role),
    studyhall,
    studyHall: studyhall,
  };
}
