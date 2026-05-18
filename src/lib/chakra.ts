export type ChakraTier = {
  label: string;
  ringClass: string;
};

export function chakraTier(chakra: number): ChakraTier {
  if (chakra >= 50) {
    return { label: "Radiant", ringClass: "from-violet-400 via-fuchsia-400 to-amber-300" };
  }
  if (chakra >= 20) {
    return { label: "Trusted", ringClass: "from-emerald-400 via-teal-400 to-cyan-300" };
  }
  if (chakra >= 5) {
    return { label: "Rising", ringClass: "from-orange-400 via-amber-400 to-yellow-300" };
  }
  return { label: "New", ringClass: "from-slate-300 via-slate-200 to-slate-300" };
}

/** Chakra points for a completed & rewarded duty. */
export function chakraPointsForDuty(rewardAmount: number): number {
  return Math.max(1, 1 + Math.floor(rewardAmount / 50));
}

export function publicPersonPath(userId?: string, visitorId?: string): string | null {
  if (userId) return `/people/u/${userId}`;
  if (visitorId) return `/people/v/${visitorId}`;
  return null;
}
