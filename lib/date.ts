import { addMonths, startOfMonth } from "date-fns-jalali";

export const APP_TIME_ZONE = "Asia/Tehran";
export const APP_LOCALE = "fa-IR";
export const APP_JALALI_LOCALE = "fa-IR-u-ca-persian";

type DateInput = Date | string | number | null | undefined;

/** Jalali month bounds in real timestamps (Asia/Tehran midnight via date-fns-jalali). */
export function getJalaliMonthRange(value: DateInput = new Date()) {
  const date = toDate(value) ?? new Date();
  const start = startOfMonth(date);
  const endExclusive = startOfMonth(addMonths(date, 1));
  return { start, endExclusive };
}

export function formatJalaliMonthName(value: DateInput = new Date()) {
  return formatTehranDate(value, { month: "long" });
}

export function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTehranDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  const date = toDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(APP_JALALI_LOCALE, {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatTehranDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) {
  return formatTehranDate(value, options);
}

export function formatTehranTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  },
) {
  return formatTehranDate(value, options);
}

export function formatTehranMonthShort(
  value: DateInput,
  locale: string | undefined = APP_JALALI_LOCALE,
) {
  const date = toDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function formatTehranParts(value: DateInput) {
  const date = toDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return {
    year: get("year") ?? "",
    month: get("month") ?? "",
    day: get("day") ?? "",
  };
}

export function formatTehranDateKey(value: DateInput) {
  const parts = formatTehranParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatJalaliNumeric(value: DateInput) {
  return formatTehranDate(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatJalaliNumericDateTime(value: DateInput) {
  return formatTehranDate(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatJalaliNumericDateTimeWithSeconds(value: DateInput) {
  return formatTehranDate(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDurationFa(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} دقیقه`;
  if (m === 0) return `${h} ساعت`;
  return `${h} ساعت و ${m} دقیقه`;
}

// Bonus: compute duration straight from two dates to avoid repeating the ms math
export function formatDurationBetween(start: Date | string, end: Date | string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return formatDurationFa(ms / (1000 * 60 * 60));
}
