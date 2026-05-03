import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { mapFlavor } from "@/lib/types";
import type { Flavor } from "@/lib/types";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, UserMinus, Loader2, UserCircle, Eye, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FriendEntry {
  rowId: number;
  friendId: string;
  username: string;
  displayName: string;
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
}

export function Friends() {
  const { user, username, isReady } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | "notfound" | null>(null);
  const [searching, setSearching] = useState(false);
  const [viewingFriend, setViewingFriend] = useState<FriendEntry | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("id, friend:profiles!friendships_friend_id_fkey(id, username, display_name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((f) => ({
        rowId: f.id as number,
        friendId: (f.friend as unknown as SearchResult).id,
        username: (f.friend as unknown as SearchResult).username,
        displayName: (f.friend as unknown as SearchResult).display_name,
      })) as FriendEntry[];
    },
  });

  const friendIds = useMemo(() => friends?.map(f => f.friendId) ?? [], [friends]);

  const { data: friendStats } = useQuery({
    queryKey: ["friend_stats", friendIds],
    enabled: friendIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("caught_flavors")
        .select("user_id")
        .in("user_id", friendIds);
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      }
      return counts;
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

  const { data: allFlavors } = useQuery({
    queryKey: ["flavors"],
    enabled: !!viewingFriend,
    queryFn: async () => {
      const { data } = await supabase.from("flavors").select("*").order("sort_order");
      return (data ?? []).map(row => mapFlavor(row as Record<string, unknown>));
    },
  });

  const { data: friendCaughtIds } = useQuery({
    queryKey: ["friend_caught", viewingFriend?.friendId],
    enabled: !!viewingFriend,
    queryFn: async () => {
      const { data } = await supabase
        .from("caught_flavors")
        .select("flavor_id")
        .eq("user_id", viewingFriend!.friendId);
      return new Set((data ?? []).map(c => c.flavor_id));
    },
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase
        .from("friendships")
        .insert({ user_id: user!.id, friend_id: friendId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: t.friends.friendAdded });
      queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
      setSearchQuery("");
      setSearchResult(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", user!.id)
        .eq("friend_id", friendId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: t.friends.friendRemoved });
      queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q === username) {
      toast({ title: t.friends.thatsYou, variant: "destructive" });
      return;
    }
    setSearching(true);
    setSearchResult(null);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("username", q)
      .maybeSingle();
    setSearchResult(data ?? "notfound");
    setSearching(false);
  };

  if (isReady && !user) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center animate-in fade-in duration-500">
        <Users className="w-20 h-20 mx-auto text-muted-foreground opacity-30 mb-6" />
        <h2 className="text-3xl font-black mb-4">Set up your profile</h2>
        <p className="text-muted-foreground font-medium text-lg mb-8 max-w-md mx-auto">
          You need to log in before you can add friends.
        </p>
      </div>
    );
  }

  const alreadyFriend = (id: string) => friends?.some(f => f.friendId === id) ?? false;

  const friendCaughtFlavors: Flavor[] = useMemo(() => {
    if (!allFlavors || !friendCaughtIds) return [];
    return allFlavors.filter(f => friendCaughtIds.has(f.id));
  }, [allFlavors, friendCaughtIds]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">{t.friends.title}</h1>
        <p className="text-muted-foreground font-medium text-lg">{t.friends.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <div className="bg-muted p-4 border-b-2 font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> {t.friends.addFriend}
            </div>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground font-medium">@</span>
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase());
                      setSearchResult(null);
                    }}
                    placeholder={t.friends.usernamePlaceholder}
                    className="pl-8 rounded-xl border-2 shadow-none font-medium h-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl font-bold h-12 shadow-sm"
                  disabled={!searchQuery || searching}
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : t.friends.searchUser}
                </Button>
              </form>

              {searchResult && (
                <div className="pt-4 border-t-2 border-dashed">
                  {searchResult === "notfound" ? (
                    <p className="text-center text-muted-foreground font-medium">{t.friends.userNotFound}</p>
                  ) : (
                    <div className="bg-primary/5 rounded-2xl p-4 border-2 border-primary/20 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
                      <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                        <UserCircle className="w-10 h-10" />
                      </div>
                      <div>
                        <p className="font-black text-lg leading-tight">{searchResult.display_name}</p>
                        <p className="text-muted-foreground font-medium text-sm">@{searchResult.username}</p>
                      </div>
                      {alreadyFriend(searchResult.id) ? (
                        <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                          {t.friends.alreadyFriends}
                        </div>
                      ) : (
                        <Button
                          className="w-full rounded-xl font-bold shadow-sm"
                          onClick={() => addFriendMutation.mutate(searchResult.id)}
                          disabled={addFriendMutation.isPending}
                        >
                          {addFriendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.friends.addFriend}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> {t.friends.yourFriends}
          </h2>
          <div className="space-y-3">
            {friendsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-3xl" />
              ))
            ) : friends && friends.length > 0 ? (
              friends.map((friend) => {
                const caught = friendStats?.[friend.friendId] ?? 0;
                const pct = totalFlavors ? Math.round((caught / totalFlavors) * 100) : 0;
                return (
                  <Card key={friend.rowId} className="rounded-3xl border-2 shadow-sm overflow-hidden group">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-11 h-11 bg-primary/15 text-primary rounded-full flex items-center justify-center shrink-0">
                            <UserCircle className="w-7 h-7" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-base leading-tight truncate">{friend.displayName}</p>
                            <p className="text-muted-foreground font-medium text-sm">@{friend.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl font-bold text-xs gap-1.5 border-2"
                            onClick={() => setViewingFriend(friend)}
                          >
                            <Eye className="w-3.5 h-3.5" /> {t.friends.viewCollection}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            onClick={() => removeFriendMutation.mutate(friend.friendId)}
                            disabled={removeFriendMutation.isPending}
                            title={t.friends.removeFriend}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 pl-14 sm:pl-[3.75rem]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-muted-foreground">{t.friends.caughtOf(caught, totalFlavors ?? "?")}</span>
                          <span className="text-xs font-black text-primary">{pct}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="py-16 text-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg mb-1">{t.friends.noFriendsYet}</p>
                <p className="text-sm">{t.friends.noFriendsHint}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Friend Collection Modal */}
      <Dialog open={!!viewingFriend} onOpenChange={(open) => !open && setViewingFriend(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-2 p-0 gap-0">
          {viewingFriend && (
            <>
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/15 text-primary rounded-full flex items-center justify-center shrink-0">
                    <UserCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <DialogTitle className="font-black text-xl">{t.friends.collectionOf(viewingFriend.displayName)}</DialogTitle>
                    <p className="text-muted-foreground font-medium text-sm">
                      @{viewingFriend.username} · {t.friends.caughtOf(friendCaughtIds?.size ?? 0, totalFlavors ?? "?")}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-5 sm:p-6">
                {!allFlavors || !friendCaughtIds ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : friendCaughtFlavors.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-bold">{t.friends.nothingCaught}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {friendCaughtFlavors.map(flavor => {
                      const hexColor = getFullColor(flavor.color);
                      const tintColor = getTintedColor(flavor.color, "15");
                      return (
                        <div
                          key={flavor.id}
                          className="rounded-2xl border-2 overflow-hidden shadow-sm"
                          style={{ borderColor: hexColor, backgroundColor: tintColor }}
                        >
                          <div className="flex items-center justify-center py-3 relative">
                            {flavor.imageUrl ? (
                              <img src={flavor.imageUrl} alt={flavor.name} className="h-14 w-auto object-contain" />
                            ) : (
                              <div className="w-9 h-16 rounded-t-2xl rounded-b-md relative shadow-md" style={{ backgroundColor: hexColor }}>
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/60 border border-black/10" />
                              </div>
                            )}
                            <div
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
                              style={{ backgroundColor: hexColor }}
                            >
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          </div>
                          <div className="bg-card px-2 py-1.5 text-center border-t-2" style={{ borderColor: hexColor }}>
                            <p className="font-black text-[11px] leading-tight">{flavor.japaneseName}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{flavor.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
