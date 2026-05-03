export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  caughtCount: number;
  totalFlavors: number;
  friendCount: number;
  hasRare: boolean;
  hasUltraRare: boolean;
  hasLegendary: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_catch",
    title: "First Drop",
    description: "Catch your very first Ramune flavor.",
    emoji: "🎉",
    check: (s) => s.caughtCount >= 1,
  },
  {
    id: "five_flavors",
    title: "Getting Started",
    description: "Catch 5 different flavors.",
    emoji: "⭐",
    check: (s) => s.caughtCount >= 5,
  },
  {
    id: "ten_flavors",
    title: "On A Roll",
    description: "Catch 10 different flavors.",
    emoji: "🔥",
    check: (s) => s.caughtCount >= 10,
  },
  {
    id: "twentyfive_flavors",
    title: "Dedicated Collector",
    description: "Catch 25 different flavors.",
    emoji: "🌟",
    check: (s) => s.caughtCount >= 25,
  },
  {
    id: "fifty_flavors",
    title: "Flavor Veteran",
    description: "Catch 50 different flavors.",
    emoji: "🏆",
    check: (s) => s.caughtCount >= 50,
  },
  {
    id: "completionist",
    title: "Completionist",
    description: "Catch every single flavor in the database.",
    emoji: "💎",
    check: (s) => s.totalFlavors > 0 && s.caughtCount >= s.totalFlavors,
  },
  {
    id: "social_butterfly",
    title: "Social Butterfly",
    description: "Add your first friend.",
    emoji: "🤝",
    check: (s) => s.friendCount >= 1,
  },
  {
    id: "squad_goals",
    title: "Squad Goals",
    description: "Have 5 or more friends.",
    emoji: "👥",
    check: (s) => s.friendCount >= 5,
  },
  {
    id: "rare_hunter",
    title: "Rare Hunter",
    description: "Catch a Rare rarity flavor.",
    emoji: "🔵",
    check: (s) => s.hasRare,
  },
  {
    id: "ultra_hunter",
    title: "Ultra Hunter",
    description: "Catch an Ultra Rare flavor.",
    emoji: "🟣",
    check: (s) => s.hasUltraRare,
  },
  {
    id: "legend_slayer",
    title: "Legend Slayer",
    description: "Catch a Legendary rarity flavor.",
    emoji: "⭐",
    check: (s) => s.hasLegendary,
  },
];
