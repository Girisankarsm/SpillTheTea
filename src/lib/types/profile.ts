export type UserProfile = {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  updatedAt?: number;
};

export const EMPTY_PROFILE: UserProfile = {
  displayName: "",
  bio: "",
};
