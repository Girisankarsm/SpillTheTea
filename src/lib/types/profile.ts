export type UserProfile = {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  chakra?: number;
  updatedAt?: number;
};

/** What others see — anonymous name + chakra only. */
export type PublicUserProfile = {
  displayName: string;
  chakra: number;
};

export const EMPTY_PROFILE: UserProfile = {
  displayName: "",
  bio: "",
  chakra: 0,
};
