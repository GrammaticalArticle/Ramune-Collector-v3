import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetFriends, useGetUser, useAddFriend, useRemoveFriend, getGetFriendsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Search, UserMinus, Loader2, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Friends() {
  const { username, isReady } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: friends, isLoading: friendsLoading } = useGetFriends(username || "", {
    query: {
      enabled: !!username,
      queryKey: getGetFriendsQueryKey(username || "")
    }
  });

  const { data: searchResult, isLoading: searchLoading, isError: searchError } = useGetUser(searchQuery, {
    query: {
      enabled: isSearching && !!searchQuery && searchQuery !== username,
      retry: false
    }
  });

  const addFriendMutation = useAddFriend({
    mutation: {
      onSuccess: () => {
        toast({ title: "Friend added!" });
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey(username || "") });
        setSearchQuery("");
        setIsSearching(false);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to add friend", variant: "destructive" });
      }
    }
  });

  const removeFriendMutation = useRemoveFriend({
    mutation: {
      onSuccess: () => {
        toast({ title: "Friend removed." });
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey(username || "") });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to remove friend", variant: "destructive" });
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    if (searchQuery === username) {
      toast({ title: "You cannot add yourself", variant: "destructive" });
      return;
    }
    setIsSearching(true);
  };

  const handleAddFriend = (friendUsername: string) => {
    if (!username) return;
    addFriendMutation.mutate({
      username,
      data: { friendUsername }
    });
  };

  const handleRemoveFriend = (friendUsername: string) => {
    if (!username) return;
    removeFriendMutation.mutate({ username, friendUsername });
  };

  if (isReady && !username) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center animate-in fade-in duration-500">
        <Users className="w-20 h-20 mx-auto text-muted-foreground opacity-30 mb-6" />
        <h2 className="text-3xl font-black mb-4">Set up your profile</h2>
        <p className="text-muted-foreground font-medium text-lg mb-8 max-w-md mx-auto">
          You need to choose a username before you can add friends and see their collections.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Friends</h1>
        <p className="text-muted-foreground font-medium text-lg">Connect with other collectors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Add Friend Section */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <div className="bg-muted p-4 border-b-2 font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Add a Friend
            </div>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground font-medium">@</span>
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase());
                        setIsSearching(false);
                      }}
                      placeholder="username"
                      className="pl-8 rounded-xl border-2 shadow-none font-medium h-12"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl font-bold h-12 shadow-sm" disabled={!searchQuery || searchLoading}>
                  {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search User"}
                </Button>
              </form>

              {isSearching && (
                <div className="pt-4 border-t-2 border-dashed">
                  {searchLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : searchResult ? (
                    <div className="bg-primary/5 rounded-2xl p-4 border-2 border-primary/20 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
                      <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                        <UserCircle className="w-10 h-10" />
                      </div>
                      <div>
                        <p className="font-black text-lg leading-tight">{searchResult.displayName}</p>
                        <p className="text-muted-foreground font-medium text-sm">@{searchResult.username}</p>
                      </div>
                      
                      {friends?.some(f => f.username === searchResult.username) ? (
                        <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full mt-2">
                          Already friends
                        </div>
                      ) : (
                        <Button 
                          className="w-full rounded-xl font-bold mt-2 shadow-sm" 
                          onClick={() => handleAddFriend(searchResult.username)}
                          disabled={addFriendMutation.isPending}
                        >
                          {addFriendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Friend"}
                        </Button>
                      )}
                    </div>
                  ) : searchError ? (
                    <div className="text-center p-4 text-muted-foreground font-medium">
                      User not found.
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Friends List Section */}
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
                <Card key={friend.id} className="rounded-3xl border-2 shadow-sm hover-elevate transition-all overflow-hidden group">
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
                      onClick={() => handleRemoveFriend(friend.username)}
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
                <p className="text-sm">Search for users to add them to your list.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}