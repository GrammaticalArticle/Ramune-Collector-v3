import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, UserMinus, Loader2, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | "notfound" | null>(null);
  const [searching, setSearching] = useState(false);
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

  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase
        .from("friendships")
        .insert({ user_id: user!.id, friend_id: friendId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Friend added!" });
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
      toast({ title: "Friend removed." });
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
      toast({ title: "That's you!", variant: "destructive" });
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Friends</h1>
        <p className="text-muted-foreground font-medium text-lg">Connect with other collectors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <div className="bg-muted p-4 border-b-2 font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Add a Friend
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
                    placeholder="username"
                    className="pl-8 rounded-xl border-2 shadow-none font-medium h-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl font-bold h-12 shadow-sm"
                  disabled={!searchQuery || searching}
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search User"}
                </Button>
              </form>

              {searchResult && (
                <div className="pt-4 border-t-2 border-dashed">
                  {searchResult === "notfound" ? (
                    <p className="text-center text-muted-foreground font-medium">User not found.</p>
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
                          Already friends
                        </div>
                      ) : (
                        <Button
                          className="w-full rounded-xl font-bold shadow-sm"
                          onClick={() => addFriendMutation.mutate(searchResult.id)}
                          disabled={addFriendMutation.isPending}
                        >
                          {addFriendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Friend"}
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
            <Users className="w-6 h-6 text-primary" /> Your Friends
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friendsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-3xl" />
              ))
            ) : friends && friends.length > 0 ? (
              friends.map((friend) => (
                <Card key={friend.rowId} className="rounded-3xl border-2 shadow-sm overflow-hidden group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary/20 text-secondary rounded-full flex items-center justify-center shrink-0">
                        <UserCircle className="w-8 h-8" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-lg leading-tight truncate">{friend.displayName}</p>
                        <p className="text-muted-foreground font-medium text-sm truncate">@{friend.username}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      onClick={() => removeFriendMutation.mutate(friend.friendId)}
                      disabled={removeFriendMutation.isPending}
                      title="Remove friend"
                    >
                      <UserMinus className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg mb-1">No friends yet</p>
                <p className="text-sm">Search for users by username to add them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
