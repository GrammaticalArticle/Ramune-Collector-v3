export type Rarity = "common" | "uncommon" | "rare" | "ultra-rare" | "legendary";

export const RARITY_XP: Record<Rarity, number> = {
  common: 10,
  uncommon: 20,
  rare: 40,
  "ultra-rare": 80,
  legendary: 150,
};

export const RARITY_CONFIG: Record<Rarity, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  emoji: string;
}> = {
  common: {
    label: "Common",
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
    glow: "",
    emoji: "⚪",
  },
  uncommon: {
    label: "Uncommon",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800",
    glow: "",
    emoji: "🟢",
  },
  rare: {
    label: "Rare",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
    glow: "shadow-blue-200/60 dark:shadow-blue-900/60",
    emoji: "🔵",
  },
  "ultra-rare": {
    label: "Ultra Rare",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-300 dark:border-purple-800",
    glow: "shadow-purple-300/60 dark:shadow-purple-900/60",
    emoji: "🟣",
  },
  legendary: {
    label: "Legendary",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-300 dark:border-amber-700",
    glow: "shadow-amber-300/80 dark:shadow-amber-900/80",
    emoji: "⭐",
  },
};

export function getRarity(catchCount: number, totalCollectors: number): Rarity {
  if (totalCollectors === 0) return "common";
  const pct = catchCount / totalCollectors;
  if (pct < 0.02) return "legendary";
  if (pct < 0.10) return "ultra-rare";
  if (pct < 0.25) return "rare";
  if (pct < 0.50) return "uncommon";
  return "common";
}
