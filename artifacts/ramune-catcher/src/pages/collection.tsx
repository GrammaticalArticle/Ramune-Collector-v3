import { useListFlavors, useListCaught, useCatchFlavor, useUncatchFlavor, getListFlavorsQueryKey, getListCaughtQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const BRAND_ORDER = ["Hata Kosen", "Doraemon", "Sangaria"];

function getCategoryColor(category: string) {
  switch(category.toLowerCase()) {
    case 'limited': return 'bg-amber-500 text-amber-950 border-amber-600';
    case 'savory': return 'bg-orange-500 text-orange-950 border-orange-600';
    case 'doraemon': return 'bg-blue-600 text-blue-50 border-blue-700';
    case 'sangaria': return 'bg-teal-500 text-teal-950 border-teal-600';
    case 'standard': return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    default: return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
  }
}

export function Collection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "caught" | "uncaught">("all");
  const queryClient = useQueryClient();

  const { data: flavors, isLoading: flavorsLoading } = useListFlavors({
    query: { queryKey: getListFlavorsQueryKey() }
  });

  const { data: caught, isLoading: caughtLoading } = useListCaught({
    query: { queryKey: getListCaughtQueryKey() }
  });

  const catchMutation = useCatchFlavor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCaughtQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      }
    }
  });

  const uncatchMutation = useUncatchFlavor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCaughtQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      }
    }
  });

  const caughtFlavorIds = useMemo(() => {
    if (!caught) return new Set<number>();
    return new Set(caught.map(c => c.flavorId));
  }, [caught]);

  const groupedFlavors = useMemo(() => {
    if (!flavors) return [];
    
    let filtered = flavors;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(lowerSearch) || 
        f.japaneseName.toLowerCase().includes(lowerSearch) ||
        f.barcode.includes(lowerSearch)
      );
    }

    if (filter === "caught") {
      filtered = filtered.filter(f => caughtFlavorIds.has(f.id));
    } else if (filter === "uncaught") {
      filtered = filtered.filter(f => !caughtFlavorIds.has(f.id));
    }

    const groups: Record<string, typeof flavors> = {};
    
    filtered.forEach(f => {
      const brand = f.brand || "Other";
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(f);
    });

    Object.keys(groups).forEach(brand => {
      groups[brand].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return Object.entries(groups).sort(([a], [b]) => {
      const idxA = BRAND_ORDER.indexOf(a);
      const idxB = BRAND_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [flavors, search, filter, caughtFlavorIds]);

  const toggleCaught = (flavorId: number, isCaught: boolean) => {
    if (isCaught) {
      uncatchMutation.mutate({ flavorId });
    } else {
      catchMutation.mutate({ data: { flavorId } });
    }
  };

  const isLoading = flavorsLoading || caughtLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">My Collection</h1>
          <p className="text-muted-foreground font-medium text-lg">
            {!isLoading && flavors && caught ? (
              <>You've caught <strong className="text-primary">{caught.length}</strong> out of {flavors.length} flavors.</>
            ) : "Loading collection..."}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-3xl border-2 shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, Japanese name, or barcode..." 
            className="pl-12 rounded-2xl border-none shadow-none h-12 font-medium bg-muted/50 focus-visible:bg-background"
          />
        </div>
        <div className="flex bg-muted/50 p-1 rounded-2xl w-full md:w-auto overflow-hidden">
          {(["all", "caught", "uncaught"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 md:w-28 px-4 py-2 rounded-xl font-bold text-sm transition-all capitalize",
                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : groupedFlavors.length > 0 ? (
        <div className="space-y-12">
          {groupedFlavors.map(([brand, brandFlavors]) => {
            const brandTotal = flavors?.filter(f => (f.brand || "Other") === brand).length || 0;
            const brandCaught = brandFlavors.filter(f => caughtFlavorIds.has(f.id)).length;
            
            return (
              <div key={brand} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black">{brand}</h2>
                  <Badge variant="outline" className="rounded-full px-3 font-bold border-2">
                    {brandCaught} / {brandTotal}
                  </Badge>
                  <div className="flex-1 h-0.5 bg-border rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {brandFlavors.map((flavor) => {
                    const isCaught = caughtFlavorIds.has(flavor.id);
                    const hexColor = getFullColor(flavor.color);
                    const tintColor = getTintedColor(flavor.color, "1A");
                    
                    return (
                      <Card 
                        key={flavor.id} 
                        className={cn(
                          "rounded-3xl border-2 overflow-hidden transition-all duration-300 relative group cursor-pointer border-l-8",
                          isCaught ? "bg-card shadow-sm hover-elevate" : "opacity-75 bg-card hover:opacity-100",
                          catchMutation.isPending && catchMutation.variables?.data?.flavorId === flavor.id && "opacity-50 pointer-events-none",
                          uncatchMutation.isPending && uncatchMutation.variables?.flavorId === flavor.id && "opacity-50 pointer-events-none"
                        )}
                        style={{ 
                          borderLeftColor: hexColor,
                          backgroundColor: isCaught ? tintColor : undefined
                        }}
                        onClick={() => toggleCaught(flavor.id, isCaught)}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <h3 className="font-black text-2xl leading-tight truncate max-w-[200px]" title={flavor.japaneseName}>
                                {flavor.japaneseName}
                              </h3>
                              <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs truncate max-w-[200px]" title={flavor.name}>
                                {flavor.name}
                              </p>
                            </div>
                            <div 
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                isCaught ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-dashed text-muted-foreground"
                              )}
                            >
                              {isCaught && <Check className="w-5 h-5" strokeWidth={3} />}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className={cn("px-2 py-0.5 font-bold text-[10px] uppercase border uppercase", getCategoryColor(flavor.category))}>
                              {flavor.category}
                            </Badge>
                          </div>

                          <div className="mt-6 pt-4 border-t-2 border-border/50">
                            <p className="font-mono text-xs text-muted-foreground font-bold tracking-widest">
                              {flavor.barcode}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed">
          <p className="font-bold text-xl mb-2">No flavors found</p>
          <p>Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
}