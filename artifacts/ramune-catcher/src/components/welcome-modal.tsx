import { useState, useEffect } from "react";
import { useCreateUser } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function WelcomeModal() {
  const { username, login, isReady } = useAuth();
  const [open, setOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const createUser = useCreateUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isReady && !username) {
      setOpen(true);
    } else if (username) {
      setOpen(false);
    }
  }, [isReady, username]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    setNewUsername(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !displayName) return;

    createUser.mutate(
      { data: { username: newUsername, displayName } },
      {
        onSuccess: (user) => {
          login(user.username, user.displayName);
          toast({ title: "Welcome to Ramune Catcher!" });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.error || "Failed to create user", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden pointer-events-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-primary font-black">Welcome to Ramune Catcher</DialogTitle>
          <DialogDescription className="text-center">
            Set up your collector profile to start tracking flavors and adding locations to the map.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
              <Input
                id="username"
                className="pl-8"
                placeholder="collector99"
                value={newUsername}
                onChange={handleUsernameChange}
                required
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Ramune Master"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={30}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={createUser.isPending || !newUsername || !displayName}>
              {createUser.isPending ? "Setting up..." : "Start Catching"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}