export type DutyStatus = "open" | "assigned" | "completed" | "rewarded";

export type DutyOfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type Duty = {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorUserId?: string;
  authorVisitorId?: string;
  status: DutyStatus;
  assignedOfferId?: string;
  rewardPaidAmount?: number;
  currency: string;
  rewardedAt?: number;
  createdAt: number;
};

export type DutyOffer = {
  id: string;
  dutyId: string;
  helperName: string;
  helperUserId?: string;
  helperVisitorId?: string;
  pitch: string;
  rewardAmount: number;
  currency: string;
  status: DutyOfferStatus;
  createdAt: number;
};

export type DutyWithOffers = Duty & {
  offers: DutyOffer[];
};

export type CreateDutyInput = {
  title: string;
  description: string;
  authorName: string;
};

export type CreateDutyOfferInput = {
  dutyId: string;
  helperName: string;
  pitch: string;
  rewardAmount: number;
  currency?: string;
};

export function formatMoney(amount: number, currency = "INR"): string {
  if (currency === "INR") return `₹${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
  return `$${amount.toFixed(2)}`;
}

export function dutyStatusLabel(status: DutyStatus): string {
  switch (status) {
    case "open":
      return "Open for offers";
    case "assigned":
      return "In progress";
    case "completed":
      return "Awaiting reward";
    case "rewarded":
      return "Rewarded";
  }
}

export function canAuthorRemoveDuty(_status: DutyStatus): boolean {
  return true;
}
