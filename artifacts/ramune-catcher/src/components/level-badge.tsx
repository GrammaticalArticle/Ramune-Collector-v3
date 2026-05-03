import { cn } from "@/lib/utils";
import { getCollectorLevel } from "@/lib/xp";

interface LevelBadgeProps {
  xp: number;
  showTitle?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LevelBadge({ xp, showTitle = true, size = "sm", className }: LevelBadgeProps) {
  const level = getCollectorLevel(xp);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-black leading-none whitespace-nowrap",
        size === "sm" && "text-[9px] px-1.5 py-0.5",
        size === "md" && "text-[11px] px-2 py-0.5",
        size === "lg" && "text-xs px-2.5 py-1",
        level.color,
        level.bgColor,
        level.borderColor,
        className
      )}
    >
      <span>Lv.{level.level}</span>
      {showTitle && <span>{level.title}</span>}
    </span>
  );
}
