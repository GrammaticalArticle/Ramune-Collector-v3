import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, LogOut, Edit2, Check, X, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useRarityStats } from "@/hooks/use-rarity-stats";
import { computeXP, getLevelProgress } from "@/lib/xp";
import { ACHIEVEMENTS } from "@/lib/achievements";
import type { AchievementStats } from "@/lib/achievements";
import type { Rarity } from "@/lib/rarity";
import { LevelBadge } from "@/components/level-badge";
import { cn } from "@/lib/utils";

export function Account() {
  const { user, profile, username, displayName, logout, updateDisplayName } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(displayName || "");

  const { data: caughtCount } = useQuery({
    queryKey: ["caught_count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("caught_flavors")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: totalFlavors } = useQuery({
    queryKey: ["flavors_count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("flavors")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: caughtFlavorIds } = useQuery({
    queryKey: ["caught_flavor_ids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("caught_flavors")
        .select("flavor_id")
        .eq("user_id", user!.id);
      return (data ?? []).map(r => r.flavor_id as number);
    },
  });

  const { data: friendCount } = useQuery({
    queryKey: ["friend_count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: rarityStats } = useRarityStats();

  const xp = useMemo(() => {
    if (!caughtFlavorIds || !rarityStats) return 0;
    const rarities = caughtFlavorIds.map(id => {
      const info = rarityStats.rarityMap[id];
      return (info?.rarity ?? "common") as Rarity;
    });
    return computeXP(rarities);
  }, [caughtFlavorIds, rarityStats]);

  const levelProgress = useMemo(() => getLevelProgress(xp), [xp]);

  const achievementStats = useMemo((): AchievementStats => {
    const ids = new Set(caughtFlavorIds ?? []);
    const hasRare = Array.from(ids).some(id => {
      const r = rarityStats?.rarityMap[id]?.rarity;
      return r === "rare" || r === "ultra-rare" || r === "legendary";
    });
    const hasUltraRare = Array.from(ids).some(id => {
      const r = rarityStats?.rarityMap[id]?.rarity;
      return r === "ultra-rare" || r === "legendary";
    });
    const hasLegendary = Array.from(ids).some(id =>
      rarityStats?.rarityMap[id]?.rarity === "legendary"
    );
    return {
      caughtCount: caughtCount ?? 0,
      totalFlavors: totalFlavors ?? 0,
      friendCount: friendCount ?? 0,
      hasRare,
      hasUltraRare,
      hasLegendary,
    };
  }, [caughtCount, totalFlavors, friendCount, caughtFlavorIds, rarityStats]);

  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter(a => a.check(achievementStats)),
    [achievementStats]
  );

  const handleSave = async () => {
    if (!newDisplayName.trim()) return;
    const error = await updateDisplayName(newDisplayName.trim());
    if (!error) {
      setEditing(false);
      toast({ title: "Saved!", description: "Display name updated." });
    } else {
      toast({ title: "Error", description: "Could not update display name.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setNewDisplayName(displayName || "");
    setEditing(false);
  };

  const handleLogOut = async () => {
    await logout();
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center text-muted-foreground">
        <p className="font-bold">{t.account.notLoggedIn}</p>
      </div>
    );
  }

  const progress = totalFlavors ? Math.round(((caughtCount ?? 0) / totalFlavors) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">{t.account.title}</h1>
        <p className="text-muted-foreground font-medium text-base">{t.account.subtitle}</p>
      </div>

      {/* Profile card */}
      <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
        <div className="bg-primary/10 p-8 flex flex-col items-center gap-3 border-b-2">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
          {editing ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <Input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="rounded-xl border-2 shadow-none font-bold text-center text-lg h-11"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <Button size="icon" variant="ghost" className="shrink-0 rounded-xl" onClick={handleSave}>
                <Check className="w-5 h-5 text-emerald-600" />
              </Button>
              <Button size="icon" variant="ghost" className="shrink-0 rounded-xl" onClick={handleCancel}>
                <X className="w-5 h-5 text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-foreground">{displayName}</span>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-lg text-muted-foreground"
                onClick={() => {
                  setNewDisplayName(displayName || "");
                  setEditing(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          <span className="text-muted-foreground font-mono font-bold text-sm">@{username}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
          <LevelBadge xp={xp} size="md" />
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-primary">{caughtCount ?? "—"}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{t.account.caught}</div>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-foreground">{totalFlavors ?? "—"}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{t.account.totalFlavors}</div>
            </div>
          </div>
          {totalFlavors != null && caughtCount != null && (
            <div className="bg-muted/30 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-muted-foreground">{t.account.collectionProgress}</span>
                <span className="text-sm font-black text-primary">{progress}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* XP & Level card */}
      <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-lg leading-tight">
                Lv.{levelProgress.level.level} — {levelProgress.level.title}
              </h2>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                {xp} XP total
                {levelProgress.level.maxXp !== Infinity && (
                  <> · {levelProgress.xpToNext} XP to next level</>
                )}
              </p>
            </div>
            {levelProgress.level.level < 7 && (
              <div className={cn(
                "text-2xl font-black w-12 h-12 rounded-2xl flex items-center justify-center",
                levelProgress.level.bgColor
              )}>
                {levelProgress.level.level + 1}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", {
                  "bg-slate-400": levelProgress.level.level === 1,
                  "bg-emerald-500": levelProgress.level.level === 2,
                  "bg-blue-500": levelProgress.level.level === 3,
                  "bg-violet-500": levelProgress.level.level === 4,
                  "bg-rose-500": levelProgress.level.level === 5,
                  "bg-amber-500": levelProgress.level.level === 6,
                  "bg-yellow-400": levelProgress.level.level === 7,
                })}
                style={{ width: `${levelProgress.pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
              <span>{levelProgress.xpInLevel} XP</span>
              {levelProgress.level.maxXp !== Infinity && (
                <span>{levelProgress.level.maxXp - levelProgress.level.minXp + 1} XP</span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">
            Earn XP by catching flavors — rarer flavors are worth more!
          </p>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Achievements</h2>
          <span className="text-sm font-bold text-muted-foreground">
            {unlockedAchievements.length} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = achievement.check(achievementStats);
            return (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                  unlocked
                    ? "bg-card border-border shadow-sm"
                    : "bg-muted/20 border-dashed border-muted-foreground/20 opacity-60"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0",
                  unlocked ? "bg-primary/10" : "bg-muted grayscale"
                )}>
                  {unlocked ? achievement.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className={cn("font-black text-sm", !unlocked && "text-muted-foreground")}>
                    {achievement.title}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium leading-snug">
                    {achievement.description}
                  </p>
                </div>
                {unlocked && (
                  <Check className="w-5 h-5 text-emerald-500 shrink-0 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <Card className="rounded-3xl border-2 border-destructive/20 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-black text-base mb-1 text-destructive">{t.account.signOut}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t.account.signOutDesc}</p>
          <Button
            variant="outline"
            className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-bold gap-2"
            onClick={handleLogOut}
          >
            <LogOut className="w-4 h-4" /> {t.account.signOutButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
