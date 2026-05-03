import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getRarity, RARITY_XP, type Rarity } from "@/lib/rarity";

export interface FlavorRarityInfo {
  rarity: Rarity;
  catchCount: number;
  pct: number;
}

export interface RarityStats {
  rarityMap: Record<number, FlavorRarityInfo>;
  totalCollectors: number;
  userXpMap: Record<string, number>;
}

export function useRarityStats() {
  return useQuery<RarityStats>({
    queryKey: ["rarity_stats"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("caught_flavors")
        .select("user_id, flavor_id");

      const rows = data ?? [];

      const flavorUserSets: Record<number, Set<string>> = {};
      const allUsers = new Set<string>();
      const userFlavorIds: Record<string, number[]> = {};

      for (const row of rows) {
        allUsers.add(row.user_id);
        if (!flavorUserSets[row.flavor_id]) flavorUserSets[row.flavor_id] = new Set();
        flavorUserSets[row.flavor_id].add(row.user_id);
        if (!userFlavorIds[row.user_id]) userFlavorIds[row.user_id] = [];
        userFlavorIds[row.user_id].push(row.flavor_id);
      }

      const totalCollectors = allUsers.size;

      const rarityMap: Record<number, FlavorRarityInfo> = {};
      for (const [flavorIdStr, userSet] of Object.entries(flavorUserSets)) {
        const flavorId = Number(flavorIdStr);
        const count = userSet.size;
        const pct = totalCollectors > 0 ? count / totalCollectors : 1;
        rarityMap[flavorId] = {
          rarity: getRarity(count, totalCollectors),
          catchCount: count,
          pct,
        };
      }

      const userXpMap: Record<string, number> = {};
      for (const [userId, flavorIds] of Object.entries(userFlavorIds)) {
        userXpMap[userId] = flavorIds.reduce((sum, fId) => {
          const info = rarityMap[fId];
          return sum + (info ? RARITY_XP[info.rarity] : 10);
        }, 0);
      }

      return { rarityMap, totalCollectors, userXpMap };
    },
  });
}
