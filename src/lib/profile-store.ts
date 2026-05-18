import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUserProfile, UserProfile } from "@/lib/types/profile";
import { getVisitorId } from "@/lib/visitor";

type ProfileState = UserProfile & {
  /** Local demo: public profiles keyed by browser visitor id. */
  localPublicProfiles: Record<string, PublicUserProfile>;
  setProfile: (input: Partial<UserProfile>) => void;
  upsertLocalPublicProfile: (visitorId: string, profile: PublicUserProfile) => void;
  awardLocalChakra: (visitorId: string, points: number, displayName?: string) => void;
  getLocalPublicProfile: (visitorId: string) => PublicUserProfile | null;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      displayName: "",
      avatarUrl: undefined,
      chakra: 0,
      updatedAt: undefined,
      paymentUpi: undefined,
      paymentPhone: undefined,
      localPublicProfiles: {},
      setProfile: (input) =>
        set((s) => ({
          ...s,
          ...input,
          updatedAt: Date.now(),
        })),
      upsertLocalPublicProfile: (visitorId, profile) =>
        set((s) => ({
          localPublicProfiles: {
            ...s.localPublicProfiles,
            [visitorId]: profile,
          },
        })),
      awardLocalChakra: (visitorId, points, displayName) =>
        set((s) => {
          const current =
            s.localPublicProfiles[visitorId] ??
            ({
              displayName: displayName?.trim() || s.displayName.trim() || "anon",
              chakra: 0,
            } satisfies PublicUserProfile);
          const nextProfile: PublicUserProfile = {
            displayName: displayName?.trim() || current.displayName,
            chakra: current.chakra + points,
          };
          const nextProfiles = {
            ...s.localPublicProfiles,
            [visitorId]: nextProfile,
          };
          return {
            localPublicProfiles: nextProfiles,
            chakra:
              getVisitorId() === visitorId ? nextProfile.chakra : s.chakra,
          };
        }),
      getLocalPublicProfile: (visitorId) => get().localPublicProfiles[visitorId] ?? null,
    }),
    {
      name: "meet-greet-profile-v1",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProfileState>;
        return {
          ...current,
          ...p,
          localPublicProfiles: p.localPublicProfiles ?? current.localPublicProfiles ?? {},
          chakra: p.chakra ?? current.chakra ?? 0,
        };
      },
    },
  ),
);

export function profileDisplayName(profile: UserProfile): string | null {
  const name = profile.displayName.trim();
  return name || null;
}
