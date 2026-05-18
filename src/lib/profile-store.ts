import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/lib/types/profile";

type ProfileState = UserProfile & {
  setProfile: (input: Partial<UserProfile>) => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      displayName: "",
      bio: "",
      avatarUrl: undefined,
      updatedAt: undefined,
      setProfile: (input) =>
        set((s) => ({
          ...s,
          ...input,
          updatedAt: Date.now(),
        })),
    }),
    { name: "meet-greet-profile-v1" },
  ),
);

export function profileDisplayName(profile: UserProfile): string | null {
  const name = profile.displayName.trim();
  return name || null;
}
