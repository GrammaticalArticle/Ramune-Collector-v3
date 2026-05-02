import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, Trophy, MapPin, Search, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Home() {
  const { data: stats, isLoading } = useGetStats({
    query: {
      queryKey: getGetStatsQueryKey(),
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground font-medium text-lg">Ready to catch some fizzy flavors today?</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <span className="text-5xl font-black">{stats.caughtFlavors}</span>
                  <span className="text-xl font-bold opacity-75 mb-1">/ {stats.totalFlavors}</span>
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
                <p className="font-bold text-muted-foreground mb-1">Snack Spots</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black">{stats.totalLocations}</span>
                  <span className="text-xl font-bold text-muted-foreground mb-1">found</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm bg-card flex flex-col justify-center items-center text-center p-6 border-dashed border-muted-foreground/30">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Got a new bottle?</h3>
            <Link href="/catch">
              <Button className="rounded-full shadow-sm font-bold w-full">
                Catch Flavor <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Recently Caught</h2>
          <Link href="/collection">
            <Button variant="ghost" className="font-bold text-primary">
              View All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : stats?.recentlyCaught && stats.recentlyCaught.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.recentlyCaught.map(caught => (
              <Card key={caught.id} className="rounded-3xl border-2 overflow-hidden hover-elevate cursor-pointer">
                <div className="h-24 bg-primary/10 flex items-center justify-center p-4">
                  {/* Placeholder for flavor visual - in reality we'd need to fetch the flavor details for these, 
                      or the backend should include flavor details in the stats response. 
                      Since we only have CaughtFlavor here, we'll just show a generic bottle shape. */}
                  <div className="w-12 h-16 rounded-t-xl rounded-b-md bg-primary opacity-50 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="p-3 text-center bg-card">
                  <p className="font-bold text-sm truncate">Flavor #{caught.flavorId}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border-2 border-dashed p-12 text-center text-muted-foreground">
            <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-bold text-lg">No flavors caught yet!</p>
            <p className="mb-6">Start your collection by scanning your first bottle.</p>
            <Link href="/catch">
              <Button className="rounded-full shadow-sm font-bold">
                Scan Barcode
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
