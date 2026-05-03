import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { mapFlavor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, Trophy, MapPin, ScanBarcode, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

export function Home() {
  const { user, displayName } = useAuth();
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

  const isLoading = caughtLoading || flavorsLoading || recentLoading;

  const handleQuickCatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickBarcode) setLocation(`/catch?barcode=${encodeURIComponent(quickBarcode)}`);
  };

  const getFlavorById = (id: number) => recentFlavors?.find(f => f.id === id);

  const hasStats = !isLoading && user;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
          Welcome Back{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="text-muted-foreground font-medium text-lg">Ready to catch some fizzy flavors today?</p>
      </div>

      <div className="bg-card rounded-3xl border-2 p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 font-bold text-muted-foreground">
          <ScanBarcode className="w-5 h-5 text-primary" /> Quick Catch
        </div>
        <form onSubmit={handleQuickCatch} className="flex gap-2 w-full">
          <Input
            value={quickBarcode}
            onChange={(e) => setQuickBarcode(e.target.value)}
            placeholder="Type barcode..."
            className="flex-1 rounded-xl shadow-none font-mono"
          />
          <Button type="submit" className="rounded-xl shadow-sm font-bold shrink-0">Catch</Button>
        </form>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : hasStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-3xl border-2 shadow-sm bg-primary text-primary-foreground">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary-foreground/20 rounded-2xl">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="font-bold opacity-90 mb-1">Collection Progress</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black">{caughtCount ?? 0}</span>
                  <span className="text-xl font-bold opacity-75 mb-1">/ {totalFlavors ?? 0}</span>
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
                <p className="font-bold text-muted-foreground mb-1">Snack Spots Found</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black">{totalLocations ?? 0}</span>
                  <span className="text-xl font-bold text-muted-foreground mb-1">worldwide</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Recently Caught</h2>
          <Link href="/collection">
            <Button variant="ghost" className="font-bold text-primary">
              View All <ArrowRight className="w-4 h-4 ml-1" />
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
                <Card key={caught.id} className="rounded-3xl border-2 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                  <div className="h-28 flex items-center justify-center p-4 border-b-2 border-inherit" style={{ backgroundColor: tintColor }}>
                    <div className="w-12 h-20 rounded-t-xl rounded-b-md relative shadow-sm" style={{ backgroundColor: hexColor }}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/50 border border-black/10" />
                    </div>
                  </div>
                  <div className="p-3 text-center bg-card">
                    <p className="font-black text-sm truncate" title={flavor.japaneseName}>{flavor.japaneseName}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate">{flavor.name}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-3xl border-2 border-dashed p-12 text-center text-muted-foreground bg-muted/20">
            <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-bold text-lg">No flavors caught yet!</p>
            <p className="mb-6">Start your collection by scanning your first bottle.</p>
            <Link href="/catch">
              <Button className="rounded-full shadow-sm font-bold">Scan Barcode</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
