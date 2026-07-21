export type RevenueTransaction = {
  id: string;
  amount: number;
  paidAt: Date | null;
  method: string;
  user: { name: string; phoneNumber: string | null };
  seatNumber: string;
};

export type RevenueReport = {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  transactions: RevenueTransaction[];
};

export type OverduePayment = {
  id: string;
  membershipId: string;
  startsAt: Date;
  endsAt: Date;
  planPrice: number;
  user: { name: string; phoneNumber: string | null };
  seatNumber: string;
};

export type OverduePaymentsReport = {
  totalOverdueAmount: number;
  overdueMemberships: OverduePayment[];
};

export type OccupancyRevenueStats = {
  totalSeats: number;
  activeMemberships: number;
  paidActiveMemberships: number;
  unpaidActiveMemberships: number;
  occupancyRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeRevenue: number;
  potentialMonthlyRevenue: number;
};