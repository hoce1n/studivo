import { AuditAction, AuditEntity } from "@/lib/generated/prisma/client";

export const auditActionLabels: Record<AuditAction, string> = {
  CREATE: "ایجاد شد",
  UPDATE: "ویرایش شد",
  DELETE: "حذف شد",
  VOID: "ابطال شد",
  CHECK_IN: "ورود ثبت شد",
  CHECK_OUT: "خروج ثبت شد",
};

export const auditEntityLabels: Record<AuditEntity, string> = {
  STUDYHALL: "سالن مطالعه",
  USER: "کاربر",
  MEMBERSHIP_PLAN: "پلن عضویت",
  MEMBERSHIP: "عضویت",
  PAYMENT: "پرداخت",
  SEAT: "صندلی",
  SEAT_ASSIGNMENT: "اختصاص صندلی",
  ATTENDANCE: "حضور و غیاب",
  STAFF_ASSIGNMENT: "اختصاص کارکنان",
  SHIFT: "شیفت کاری",
  EXPENSE: "هزینه",
  NOTIFICATION: "اعلان",
};

export const actionVariants: Record<AuditAction, "default" | "secondary" | "destructive" | "outline" | "muted"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  VOID: "destructive",
  CHECK_IN: "outline",
  CHECK_OUT: "outline",
};
