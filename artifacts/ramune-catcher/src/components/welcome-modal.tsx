import { useState, useEffect } from "react";
import { useCreateUser } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "signup";

export function WelcomeModal() {
  const { username, login, isReady } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [inputUsername, setInputUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
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
    setInputUsername(val);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setInputUsername("");
    setDisplayName("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername) return;
    setLoginLoading(true);
    try {
      const res = await fetch(`/api/users/${inputUsername}`);
      if (!res.ok) {
        toast({
          title: "Account not found",
          description: `No account with username @${inputUsername}. Try signing up instead.`,
          variant: "destructive",
        });
        return;
      }
      const user = await res.json();
      login(user.username, user.displayName);
      toast({ title: `Welcome back, ${user.displayName}!` });
    } catch {
      toast({ title: "Error", description: "Could not connect. Please try again.", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername || !displayName) return;
    createUser.mutate(
      { data: { username: inputUsername, displayName } },
      {
        onSuccess: (user) => {
          login(user.username, user.displayName);
          toast({ title: "Welcome to Ramune Catcher!" });
        },
        onError: () => {
          toast({ title: "Username taken", description: "That username is already in use. Try logging in instead.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-sm [&>button]:hidden pointer-events-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-primary font-black">Ramune Catcher</DialogTitle>
          <DialogDescription className="text-center">
            {mode === "login" ? "Log in to your collector profile." : "Create a new collector profile."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === "signup" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="login-username"
                  className="pl-8"
                  placeholder="your_username"
                  value={inputUsername}
                  onChange={handleUsernameChange}
                  required
                  maxLength={20}
                  autoComplete="username"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loginLoading || !inputUsername}>
                {loginLoading ? "Signing in..." : "Log In"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="signup-username"
                  className="pl-8"
                  placeholder="collector99"
                  value={inputUsername}
                  onChange={handleUsernameChange}
                  required
                  maxLength={20}
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-displayName">Display Name</Label>
              <Input
                id="signup-displayName"
                placeholder="Ramune Master"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={30}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={createUser.isPending || !inputUsername || !displayName}
              >
                {createUser.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
