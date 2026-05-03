import { cn } from "@/lib/utils";
import type { Rarity } from "@/lib/rarity";
import { RARITY_CONFIG, RARITY_XP } from "@/lib/rarity";

interface RarityBadgeProps {
  rarity: Rarity;
  showXp?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RarityBadge({ rarity, showXp, size = "sm", className }: RarityBadgeProps) {
  const cfg = RARITY_CONFIG[rarity];
  const isLegendary = rarity === "legendary";
  const hasGlow = rarity === "rare" || rarity === "ultra-rare" || rarity === "legendary";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border font-black uppercase tracking-wider leading-none whitespace-nowrap",
        size === "sm"  && "text-[7px] px-1.5 py-0.5",
        size === "md"  && "text-[9px] px-2 py-0.5",
        size === "lg"  && "text-[11px] px-2.5 py-1",
        cfg.color,
        cfg.bg,
        cfg.border,
        hasGlow && `shadow-sm ${cfg.glow}`,
        isLegendary && "animate-pulse",
        className
      )}
    >
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
      {showXp && (
        <span className="opacity-70 ml-0.5">+{RARITY_XP[rarity]} XP</span>
      )}
    </span>
  );
}
