import type { Rarity } from "./rarity";
import { RARITY_XP } from "./rarity";

export interface CollectorLevel {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const COLLECTOR_LEVELS: CollectorLevel[] = [
  { level: 1, title: "Rookie",      minXp: 0,    maxXp: 99,   color: "text-slate-500",                        bgColor: "bg-slate-100 dark:bg-slate-800",        borderColor: "border-slate-300 dark:border-slate-600" },
  { level: 2, title: "Collector",   minXp: 100,  maxXp: 299,  color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/50",  borderColor: "border-emerald-200 dark:border-emerald-800" },
  { level: 3, title: "Enthusiast",  minXp: 300,  maxXp: 599,  color: "text-blue-600 dark:text-blue-400",       bgColor: "bg-blue-50 dark:bg-blue-950/50",        borderColor: "border-blue-200 dark:border-blue-800" },
  { level: 4, title: "Connoisseur", minXp: 600,  maxXp: 999,  color: "text-violet-600 dark:text-violet-400",   bgColor: "bg-violet-50 dark:bg-violet-950/50",    borderColor: "border-violet-200 dark:border-violet-800" },
  { level: 5, title: "Expert",      minXp: 1000, maxXp: 1799, color: "text-rose-600 dark:text-rose-400",       bgColor: "bg-rose-50 dark:bg-rose-950/50",        borderColor: "border-rose-200 dark:border-rose-800" },
  { level: 6, title: "Master",      minXp: 1800, maxXp: 2999, color: "text-amber-500 dark:text-amber-400",     bgColor: "bg-amber-50 dark:bg-amber-950/50",      borderColor: "border-amber-200 dark:border-amber-700" },
  { level: 7, title: "Legend",      minXp: 3000, maxXp: Infinity, color: "text-yellow-500",                    bgColor: "bg-yellow-50 dark:bg-yellow-950/50",    borderColor: "border-yellow-300 dark:border-yellow-700" },
];

export function computeXP(rarities: Rarity[]): number {
  return rarities.reduce((sum, r) => sum + (RARITY_XP[r] ?? 10), 0);
}

export function getCollectorLevel(xp: number): CollectorLevel {
  for (let i = COLLECTOR_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= COLLECTOR_LEVELS[i].minXp) return COLLECTOR_LEVELS[i];
  }
  return COLLECTOR_LEVELS[0];
}

export function getLevelProgress(xp: number): {
  level: CollectorLevel;
  pct: number;
  xpInLevel: number;
  xpToNext: number;
} {
  const level = getCollectorLevel(xp);
  if (level.maxXp === Infinity) {
    return { level, pct: 100, xpInLevel: xp - level.minXp, xpToNext: 0 };
  }
  const range = level.maxXp - level.minXp + 1;
  const xpInLevel = xp - level.minXp;
  const pct = Math.min(100, Math.round((xpInLevel / range) * 100));
  return { level, pct, xpInLevel, xpToNext: level.maxXp - xp + 1 };
}
