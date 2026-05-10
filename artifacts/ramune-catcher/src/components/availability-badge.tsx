import { cn } from "@/lib/utils";
import { Calendar, Clock, Sparkles } from "lucide-react";

export type AvailabilityStatus = "active" | "upcoming" | "expired" | null;

export function formatAvailDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function getAvailabilityStatus(
  availableFrom: string | null,
  availableUntil: string | null
): AvailabilityStatus {
  if (!availableFrom && !availableUntil) return null;
  const now = new Date();
  const from = availableFrom ? new Date(availableFrom + "T00:00:00") : null;
  const until = availableUntil ? new Date(availableUntil + "T23:59:59") : null;
  if (from && from > now) return "upcoming";
  if (until && until < now) return "expired";
  return "active";
}

interface AvailabilityBadgeProps {
  availableFrom: string | null;
  availableUntil: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvailabilityBadge({
  availableFrom,
  availableUntil,
  size = "sm",
  className,
}: AvailabilityBadgeProps) {
  const status = getAvailabilityStatus(availableFrom, availableUntil);
  if (!status) return null;

  const from = availableFrom ? formatAvailDate(availableFrom) : null;
  const until = availableUntil ? formatAvailDate(availableUntil) : null;

  const rangeLabel =
    from && until ? `${from} – ${until}` :
    from ? `From ${from}` :
    until ? `Until ${until}` : "";

  const configs = {
    active: {
      label: until ? `In Stock · Until ${until}` : "In Stock Now",
      icon: <Sparkles className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />,
      colors: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800",
    },
    upcoming: {
      label: from ? `Coming ${from}` : "Coming Soon",
      icon: <Clock className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />,
      colors: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800",
    },
    expired: {
      label: rangeLabel || "Limited Run",
      icon: <Calendar className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />,
      colors: "text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
    },
  };

  const cfg = configs[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold leading-none",
        size === "sm" && "text-[8px] px-1.5 py-0.5",
        size === "md" && "text-[10px] px-2 py-0.5",
        size === "lg" && "text-xs px-2.5 py-1",
        cfg.colors,
        className
      )}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
}
