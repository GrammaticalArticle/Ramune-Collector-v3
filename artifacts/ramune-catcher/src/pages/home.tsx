import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { mapFlavor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, Trophy, MapPin, Scan, ScanBarcode, Medal, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function Home() {
  const { user, displayName } = useAuth();
  const { t } = useLanguage();
  const [quickBarcode, setQuickBarcode] = useState("");
  const [, setLocation] = useLocation();

  const { data: caughtCount, isLoading: caughtLoading } = useQuery({
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

  const { data: totalFlavors, isLoading: flavorsLoading } = useQuery({
    queryKey: ["flavors_count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("flavors")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: totalLocations } = useQuery({
    queryKey: ["locations_count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("locations")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: recentCaught, isLoading: recentLoading } = useQuery({
    queryKey: ["recent_caught", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("caught_flavors")
        .select("id, flavor_id, caught_at")
        .eq("user_id", user!.id)
        .order("caught_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const recentFlavorIds = recentCaught?.map(c => c.flavor_id) ?? [];
  const { data: recentFlavors } = useQuery({
    queryKey: ["recent_flavors", recentFlavorIds],
    enabled: recentFlavorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("flavors")
        .select("*")
        .in("id", recentFlavorIds);
      return (data ?? []).map(row => mapFlavor(row as Record<string, unknown>));
    },
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("caught_flavors")
        .select("user_id");

      const counts: Record<string, number> = {};
      for (const r of rows ?? []) {
        counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      }

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

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
        };
      });
    },
  });

  const isLoading = caughtLoading || flavorsLoading || recentLoading;

  const handleQuickCatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickBarcode) setLocation(`/catch?barcode=${encodeURIComponent(quickBarcode)}`);
  };

  const getFlavorById = (id: number) => recentFlavors?.find(f => f.id === id);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 text-center font-black text-muted-foreground text-sm leading-5">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
          {displayName ? t.home.welcomeBackName(displayName) : t.home.welcomeBack}
        </h1>
        <p className="text-muted-foreground font-medium text-lg">{t.home.readyToCatch}</p>
      </div>

      <div className="bg-card rounded-3xl border-2 p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 font-bold text-muted-foreground">
          <ScanBarcode className="w-5 h-5 text-primary" /> {t.home.quickCatch}
        </div>
        <form onSubmit={handleQuickCatch} className="flex gap-2 w-full">
          <Input
            value={quickBarcode}
            onChange={(e) => setQuickBarcode(e.target.value)}
            placeholder={t.home.quickCatchPlaceholder}
            className="flex-1 rounded-xl shadow-none font-mono"
          />
          <Button type="submit" className="rounded-xl shadow-sm font-bold shrink-0">{t.home.catch}</Button>
        </form>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : user ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-3xl border-2 shadow-sm bg-primary text-primary-foreground">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary-foreground/20 rounded-2xl">
                  <Trophy className="w-6 h-6" />
                </div>
                <span className="text-primary-foreground/70 font-bold text-sm">
                  {totalFlavors ? Math.round(((caughtCount ?? 0) / totalFlavors) * 100) : 0}%
                </span>
              </div>
              <div>
                <p className="font-bold opacity-90 mb-1">{t.home.collectionProgress}</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-5xl font-black">{caughtCount ?? 0}</span>
                  <span className="text-xl font-bold opacity-75 mb-1">/ {totalFlavors ?? 0}</span>
                </div>
                <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-foreground rounded-full transition-all duration-700"
                    style={{ width: `${totalFlavors ? Math.round(((caughtCount ?? 0) / totalFlavors) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-secondary/20 text-secondary rounded-2xl">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="font-bold text-muted-foreground mb-1">{t.home.snackSpotsFound}</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black">{totalLocations ?? 0}</span>
                  <span className="text-xl font-bold text-muted-foreground mb-1">{t.home.worldwide}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">{t.home.recentlyCaught}</h2>
          <Link href="/collection">
            <Button variant="ghost" className="font-bold text-primary">
              {t.home.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
          </div>
        ) : recentCaught && recentCaught.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentCaught.map(caught => {
              const flavor = getFlavorById(caught.flavor_id);
              if (!flavor) return null;
              const hexColor = getFullColor(flavor.color);
              const tintColor = getTintedColor(flavor.color, "1A");
              return (
                <Card key={caught.id} className="rounded-3xl border-2 overflow-hidden hover:scale-[1.02] transition-transform shadow-sm">
                  <div className="h-28 flex items-center justify-center p-4 border-b-2" style={{ backgroundColor: tintColor }}>
                    <div className="w-12 h-20 rounded-t-xl rounded-b-md relative shadow-sm" style={{ backgroundColor: hexColor }}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/50 border border-black/10" />
                    </div>
                  </div>
                  <div className="p-3 text-center bg-card">
                    <p className="font-black text-sm leading-tight">{flavor.japaneseName}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{flavor.name}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-3xl border-2 border-dashed p-12 text-center text-muted-foreground bg-muted/20">
            <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-bold text-lg">{t.home.noCaughtYet}</p>
            <p className="mb-6">{t.home.startCollection}</p>
            <Link href="/catch">
              <Button className="rounded-full shadow-sm font-bold">{t.home.scanBarcode}</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> {t.home.leaderboard}
          </h2>
          <Link href="/leaderboard">
            <Button variant="ghost" className="font-bold text-primary">
              {t.home.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {leaderboardLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            {leaderboard.map((entry) => {
              const isMe = entry.userId === user?.id;
              const pct = totalFlavors ? Math.round((entry.count / totalFlavors) * 100) : 0;
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 border-b last:border-b-0",
                    isMe ? "bg-primary/5" : "bg-card"
                  )}
                >
                  <div className="flex items-center justify-center w-7 shrink-0">
                    {rankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-sm truncate">{entry.displayName}</span>
                      {isMe && (
                        <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{t.leaderboard.you}</span>
                      )}
                      <span className="text-muted-foreground font-medium text-xs shrink-0">@{entry.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-primary shrink-0">{t.home.caughtOf(entry.count, totalFlavors ?? 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        ) : (
          <Card className="rounded-3xl border-2 border-dashed p-8 text-center text-muted-foreground bg-muted/20">
            <p className="font-bold">{t.home.noCatches}</p>
          </Card>
        )}
      </div>

      {/* FAQ */}
      <div className="space-y-4 pb-4">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" /> {t.faq.title}
        </h2>
        <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
          <Accordion type="single" collapsible className="px-5">
            <AccordionItem value="barcode">
              <AccordionTrigger className="font-bold text-base hover:no-underline">
                {t.faq.q1}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium leading-relaxed space-y-1">
                <p>{t.faq.a1}</p>
                <a href="mailto:tymofiizeniuk@gmail.com?subject=Missing%20barcode%20report" className="font-bold text-primary underline">
                  tymofiizeniuk@gmail.com
                </a>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="map">
              <AccordionTrigger className="font-bold text-base hover:no-underline">
                {t.faq.q2}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium leading-relaxed space-y-1">
                <p>{t.faq.a2}</p>
                <a href="mailto:tymofiizeniuk@gmail.com?subject=Snack%20spot%20submission" className="font-bold text-primary underline">
                  tymofiizeniuk@gmail.com
                </a>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="safety" className="border-b-0">
              <AccordionTrigger className="font-bold text-base hover:no-underline">
                {t.faq.q3}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium leading-relaxed">
                {t.faq.a3}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
}
