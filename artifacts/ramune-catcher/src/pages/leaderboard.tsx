import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  count: number;
  username: string;
  displayName: string;
}

export function Leaderboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: totalFlavors } = useQuery({
    queryKey: ["flavors_count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("flavors")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard_full"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("caught_flavors")
        .select("user_id");

      const counts: Record<string, number> = {};
      for (const r of rows ?? []) {
        counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      }

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a);

      if (!sorted.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", sorted.map(([id]) => id));

      return sorted.map(([userId, count], idx) => {
        const profile = profiles?.find(p => p.id === userId);
        return {
          rank: idx + 1,
          userId,
          count,
          username: profile?.username ?? "unknown",
          displayName: profile?.display_name ?? "Unknown",
        } as LeaderboardEntry;
      });
    },
  });

  const userEntry = leaderboard?.find(e => e.userId === user?.id);
  const top10 = leaderboard?.slice(0, 10) ?? [];
  const userInTop10 = top10.some(e => e.userId === user?.id);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return (
      <span className="w-6 h-6 flex items-center justify-center font-black text-muted-foreground text-sm">
        {rank}
      </span>
    );
  };

  const renderEntry = (entry: LeaderboardEntry, highlight?: boolean) => {
    const isMe = entry.userId === user?.id;
    const pct = totalFlavors ? Math.round((entry.count / totalFlavors) * 100) : 0;
    return (
      <div
        key={entry.userId}
        className={cn(
          "flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors",
          isMe || highlight ? "bg-primary/5" : "bg-card"
        )}
      >
        <div className="flex items-center justify-center w-8 shrink-0">
          {rankIcon(entry.rank)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-black text-sm truncate">{entry.displayName}</span>
            {isMe && (
              <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                {t.leaderboard.you}
              </span>
            )}
            <span className="text-muted-foreground font-medium text-xs shrink-0 hidden sm:block">
              @{entry.username}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-black text-primary shrink-0 w-20 text-right">
              {t.leaderboard.caughtOf(entry.count, totalFlavors ?? 0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-yellow-500/15 text-yellow-500 rounded-2xl">
          <Trophy className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-1">{t.leaderboard.title}</h1>
          <p className="text-muted-foreground font-medium text-lg">{t.leaderboard.subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : top10.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed p-12 text-center text-muted-foreground bg-muted/20">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold text-lg mb-1">{t.leaderboard.noEntries}</p>
          <p className="text-sm">{t.leaderboard.beFirst}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top 3 podium */}
          {top10.length >= 3 && (
            <div className="grid grid-cols-3 gap-3">
              {/* 2nd place */}
              {top10[1] && (
                <div className={cn(
                  "flex flex-col items-center justify-end gap-2 pt-8 pb-4 px-3 rounded-3xl border-2 bg-card",
                  top10[1].userId === user?.id ? "border-primary bg-primary/5" : "border-border"
                )}>
                  <Medal className="w-8 h-8 text-slate-400" />
                  <div className="text-center">
                    <p className="font-black text-sm leading-tight truncate w-full">{top10[1].displayName}</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                      {top10[1].count} {t.leaderboard.caughtCount.toLowerCase()}
                    </p>
                  </div>
                </div>
              )}
              {/* 1st place */}
              {top10[0] && (
                <div className={cn(
                  "flex flex-col items-center justify-end gap-2 pb-4 px-3 rounded-3xl border-2 -mt-4 bg-yellow-500/5",
                  top10[0].userId === user?.id ? "border-primary" : "border-yellow-500/40"
                )}>
                  <Trophy className="w-10 h-10 text-yellow-500" />
                  <div className="text-center">
                    <p className="font-black text-sm leading-tight truncate w-full">{top10[0].displayName}</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                      {top10[0].count} {t.leaderboard.caughtCount.toLowerCase()}
                    </p>
                  </div>
                </div>
              )}
              {/* 3rd place */}
              {top10[2] && (
                <div className={cn(
                  "flex flex-col items-center justify-end gap-2 pt-12 pb-4 px-3 rounded-3xl border-2 bg-card",
                  top10[2].userId === user?.id ? "border-primary bg-primary/5" : "border-border"
                )}>
                  <Medal className="w-7 h-7 text-amber-600" />
                  <div className="text-center">
                    <p className="font-black text-sm leading-tight truncate w-full">{top10[2].displayName}</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                      {top10[2].count} {t.leaderboard.caughtCount.toLowerCase()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full list */}
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            {top10.map(entry => renderEntry(entry))}
          </Card>

          {/* User's own rank if outside top 10 */}
          {userEntry && !userInTop10 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
                {t.leaderboard.yourRank}
              </p>
              <Card className="rounded-3xl border-2 border-primary/30 shadow-sm overflow-hidden">
                {renderEntry(userEntry, true)}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
