export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type SeatStatus = "available" | "reserved" | "renewal" | "expired";

export function getSeatStatus(endsAt?: Date): SeatStatus {
  if (!endsAt) return "available";

  const diffDays = Math.ceil((endsAt.getTime() - Date.now()) / DAY_IN_MS);
  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "renewal";
  return "reserved";
}

export const statusCopy: Record<
  SeatStatus,
  {
    label: string;
    className: string;
    dot: string;
    badge: "success" | "warning" | "destructive" | "muted";
  }
> = {
  available: {
    label: "خالی",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    dot: "bg-emerald-500",
    badge: "success",
  },
  reserved: {
    label: "رزرو فعال",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    dot: "bg-red-500",
    badge: "destructive",
  },
  renewal: {
    label: "نیازمند تمدید",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    dot: "bg-amber-500",
    badge: "warning",
  },
  expired: {
    label: "منقضی",
    className:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    dot: "bg-slate-400",
    badge: "muted",
  },
};

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function processSeatData(seats: any[], sortByRenewal: boolean) {
  const initialSeatView = seats.map((seat) => {
    const currentAssignment = seat.assignments[0];
    const membership = currentAssignment?.membership;
    const seatNum = parseInt(seat.number, 10) || 0;
    return {
      ...seat,
      seatNumber: seatNum,
      membership,
      status: getSeatStatus(membership?.endsAt),
    };
  });

  const seatView = sortByRenewal
    ? [...initialSeatView].sort((a, b) => {
        const timeA = a.membership ? new Date(a.membership.endsAt).getTime() : Infinity;
        const timeB = b.membership ? new Date(b.membership.endsAt).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return a.seatNumber - b.seatNumber;
      })
    : initialSeatView;

  const stats = {
    available: seatView.filter((s) => s.status === "available").length,
    reserved: seatView.filter((s) => s.status === "reserved").length,
    renewal: seatView.filter((s) => s.status === "renewal").length,
    expired: seatView.filter((s) => s.status === "expired").length,
  };

  let activeRevenue = 0;
  let atRiskRevenue = 0;

  seatView.forEach((s) => {
    if (s.membership) {
      const price = Number(s.membership.planPrice) || 0;
      if (s.status === "reserved") activeRevenue += price;
      if (s.status === "renewal") atRiskRevenue += price;
    }
  });

  return { seatView, stats, activeRevenue, atRiskRevenue };
}