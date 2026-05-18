export type RideStatus = "open" | "matched" | "completed" | "rewarded";

export type RideOfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type RideRequest = {
  id: string;
  riderName: string;
  riderUserId?: string;
  pickupLabel: string;
  pickupLat?: number;
  pickupLng?: number;
  dropLabel: string;
  dropLat?: number;
  dropLng?: number;
  notes: string;
  maxReward?: number;
  currency: string;
  status: RideStatus;
  matchedOfferId?: string;
  rewardPaidAmount?: number;
  rewardedAt?: number;
  createdAt: number;
};

export type RideOffer = {
  id: string;
  rideId: string;
  driverName: string;
  driverUserId?: string;
  pitch: string;
  rewardAmount: number;
  currency: string;
  status: RideOfferStatus;
  createdAt: number;
};

export type RideWithOffers = RideRequest & {
  offers: RideOffer[];
};

export type CreateRideInput = {
  riderName: string;
  pickupLabel: string;
  pickupLat?: number;
  pickupLng?: number;
  dropLabel: string;
  dropLat?: number;
  dropLng?: number;
  notes?: string;
  maxReward?: number;
  currency?: string;
};

export type CreateRideOfferInput = {
  rideId: string;
  driverName: string;
  pitch: string;
  rewardAmount: number;
  currency?: string;
};

export function formatMoney(amount: number, currency = "INR"): string {
  if (currency === "INR") return `₹${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
  return `$${amount.toFixed(2)}`;
}

export function rideStatusLabel(status: RideStatus): string {
  switch (status) {
    case "open":
      return "Looking for a ride";
    case "matched":
      return "Driver matched";
    case "completed":
      return "Drop complete";
    case "rewarded":
      return "Rewarded";
  }
}

export function canRiderRemoveRide(_status: RideStatus): boolean {
  return true;
}
