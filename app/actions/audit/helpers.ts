import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};

/**
 * Normalizes action errors into a safe response object.
 * Maps Prisma P2002 (unique constraint violation) — most notably the
 * partial unique indexes guarding seat/membership double-booking — to a
 * Persian, user-facing conflict message instead of leaking the raw
 * Prisma/Postgres error text.
 *
 * IMPORTANT: this matches on the *message text*, not `error.meta`.
 * Verified against @prisma/adapter-pg@7.9's source: for Postgres unique
 * violations (SQLSTATE 23505), the adapter parses column names out of the
 * driver's error `detail` string and only ever produces `{ fields: [...] }`
 * — never an index/constraint name — so `error.meta.target` /
 * `error.meta.constraint` is NOT reliable for indexes that aren't declared
 * in schema.prisma (like our partial indexes). The resulting message is
 * predictable though: "Unique constraint failed on the fields: (`seat_id`)".
 * Confirm this against a real error the first time 0.2's concurrency test
 * fires a genuine conflict — if Prisma's error format changes in a future
 * version, this match needs updating too.
 */
export function actionError<T = unknown>(error: unknown, fallback: string): ActionResult<T> {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    if (error.message.includes("seat_id")) {
      return {
        success: false,
        error: "این صندلی همین الان توسط یک درخواست دیگر رزرو شد. لطفاً دوباره تلاش کنید.",
      };
    }
    if (error.message.includes("membership_id")) {
      return {
        success: false,
        error: "این عضویت همین الان یک صندلی فعال دیگر دریافت کرد. لطفاً صفحه را رفرش کنید.",
      };
    }
    return {
      success: false,
      error: "این عملیات با یک رزرو همزمان دیگر تداخل داشت. لطفاً دوباره تلاش کنید.",
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return { success: false, error: error.message };
  }

  return { success: false, error: fallback };
}

/**
 * Revalidates core operational dashboard paths across the application.
 */
export function revalidateOperationalPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/memberships");
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard/logs");
}
