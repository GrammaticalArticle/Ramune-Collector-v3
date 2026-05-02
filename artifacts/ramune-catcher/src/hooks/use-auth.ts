import { useState, useEffect } from "react";

export function useAuth() {
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem("ramune_username"));
    setDisplayName(localStorage.getItem("ramune_display_name"));
  }, []);

  const login = (u: string, d: string) => {
    localStorage.setItem("ramune_username", u);
    localStorage.setItem("ramune_display_name", d);
    setUsername(u);
    setDisplayName(d);
  };

  return { username, displayName, login, isReady: true };
}