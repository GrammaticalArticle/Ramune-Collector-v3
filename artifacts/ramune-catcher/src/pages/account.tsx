import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, LogOut, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Account() {
  const { username, displayName, login, logout } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(displayName || "");

  const statsParams = username ? { username } : undefined;
  const { data: stats } = useGetStats(statsParams, {
    query: { enabled: !!username, queryKey: getGetStatsQueryKey(statsParams) }
  });

  const handleSave = () => {
    if (!newDisplayName.trim()) return;
    login(username!, newDisplayName.trim());
    setEditing(false);
    toast({ title: "Saved!", description: "Display name updated." });
  };

  const handleCancel = () => {
    setNewDisplayName(displayName || "");
    setEditing(false);
  };

  const handleLogOut = () => {
    logout();
  };

  if (!username) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center text-muted-foreground">
        <p className="font-bold">Not logged in.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">Account</h1>
        <p className="text-muted-foreground font-medium text-base">Your collector profile.</p>
      </div>

      {/* Profile Card */}
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
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-primary">{stats?.caughtFlavors ?? "—"}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Caught</div>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-foreground">{stats?.totalFlavors ?? "—"}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Total Flavors</div>
            </div>
          </div>
          {stats && (
            <div className="bg-muted/30 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-muted-foreground">Collection progress</span>
                <span className="text-sm font-black text-primary">
                  {Math.round(((stats.caughtFlavors ?? 0) / (stats.totalFlavors ?? 1)) * 100)}%
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(((stats.caughtFlavors ?? 0) / (stats.totalFlavors ?? 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-3xl border-2 border-destructive/20 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-black text-base mb-1 text-destructive">Sign out</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This clears your local profile. Your catches are saved to the server.
          </p>
          <Button
            variant="outline"
            className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 font-bold gap-2"
            onClick={handleLogOut}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
