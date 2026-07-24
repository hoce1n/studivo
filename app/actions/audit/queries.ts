"use server";

import { prisma } from "@/lib/db";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { Prisma } from "@prisma/client";

export type AuditLogFilters = {
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  action?: string;
  entityType?: string;
  actorId?: string;
  search?: string;
};

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  // Only OWNER can see all logs
  if (user.role !== "OWNER") {
    throw new Error("دسترسی غیرمجاز");
  }

  const {
    page = 1,
    pageSize = 25,
    startDate,
    endDate,
    action,
    entityType,
    actorId,
    search,
  } = filters;

  const where: Prisma.AuditLogWhereInput = {
    studyHallId,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (action) {
    where.action = action as any;
  }

  if (entityType) {
    where.entityType = entityType as any;
  }

  if (actorId) {
    where.actorId = actorId;
  }

  if (search) {
    where.OR = [
      { entityId: { contains: search, mode: "insensitive" } },
      { 
        metadata: {
          path: ["actionType"],
          string_contains: search,
        }
      },
      {
        actor: {
          name: { contains: search, mode: "insensitive" }
        }
      }
    ];
  }

  const [totalCount, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  };
}

export async function getAuditLogActors() {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  if (user.role !== "OWNER") {
    throw new Error("دسترسی غیرمجاز");
  }

  const actors = await prisma.user.findMany({
    where: {
      auditLogs: {
        some: { studyHallId }
      }
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" }
  });

  return actors;
}
