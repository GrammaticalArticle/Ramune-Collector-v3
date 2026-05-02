import { useListFlavors, useListCaught, getListFlavorsQueryKey, getListCaughtQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export function Collection() {
  const [search, setSearch] = useState("");

  const { data: flavors, isLoading: flavorsLoading } = useListFlavors({
    query: { queryKey: getListFlavorsQueryKey() }
  });

  const { data: caught, isLoading: caughtLoading } = useListCaught({
    query: { queryKey: getListCaughtQueryKey() }
  });

  const caughtFlavorIds = useMemo(() => {
    if (!caught) return new Set<number>();
    return new Set(caught.map(c => c.flavorId));
  }, [caught]);

  const filteredFlavors = useMemo(() => {
    if (!flavors) return [];
    if (!search) return flavors;
    const lowerSearch = search.toLowerCase();
    return flavors.filter(f => 
      f.name.toLowerCase().includes(lowerSearch) || 
      f.barcode.includes(lowerSearch)
    );
  }, [flavors, search]);

  const isLoading = flavorsLoading || caughtLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Flavor Collection</h1>
          <p className="text-muted-foreground font-medium text-lg">
            {!isLoading && flavors && caught ? (
              <>You've caught <strong className="text-primary">{caught.length}</strong> out of {flavors.length} flavors.</>
            ) : "Loading collection..."}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flavors..." 
            className="pl-10 rounded-2xl border-2 shadow-sm h-12 font-medium bg-card"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
          ))
        ) : filteredFlavors.length > 0 ? (
          filteredFlavors.map((flavor) => {
            const isCaught = caughtFlavorIds.has(flavor.id);
            
            return (
              <Card 
                key={flavor.id} 
                className={cn(
                  "rounded-3xl border-2 overflow-hidden transition-all duration-300",
                  isCaught ? "hover-elevate shadow-sm bg-card" : "opacity-60 grayscale-[0.8] hover:grayscale-[0.5] bg-muted/50 border-dashed"
                )}
              >
                <div 
                  className="aspect-square relative flex items-center justify-center p-6 border-b-2 border-inherit"
                  style={{ backgroundColor: isCaught ? `${flavor.color}15` : undefined }}
                >
                  {isCaught && (
                    <div className="absolute top-3 right-3 text-primary bg-primary-foreground rounded-full">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  
                  {/* Bottle visualization */}
                  <div 
                    className={cn(
                      "w-16 h-28 rounded-t-2xl rounded-b-lg relative transition-transform duration-500",
                      isCaught ? "shadow-lg scale-110" : "shadow-sm"
                    )} 
                    style={{ backgroundColor: isCaught ? flavor.color : 'var(--muted-foreground)' }}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white/50 border-2 border-black/10" />
                    <div className="absolute inset-x-0 top-1/3 bottom-2 bg-white/20 rounded-md mx-1.5 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-col">
                    </div>
                  </div>
                </div>
                
                <div className="p-4 text-center">
                  <h3 className="font-black text-lg leading-tight mb-1 truncate">{flavor.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{flavor.barcode}</p>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <p className="font-bold text-xl">No flavors found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
