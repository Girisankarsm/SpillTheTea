export type UserProfile = {
  displayName: string;
  avatarUrl?: string | null;
  chakra?: number;
  updatedAt?: number;
  paymentUpi?: string;
  paymentPhone?: string;
};

/** What others see — anonymous name + chakra only. */
export type PublicUserProfile = {
  displayName: string;
  chakra: number;
};

export const EMPTY_PROFILE: UserProfile = {
  displayName: "",
  chakra: 0,
};
