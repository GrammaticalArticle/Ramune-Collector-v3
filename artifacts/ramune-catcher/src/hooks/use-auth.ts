import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setIsReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setProfile({
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        isAdmin: data.is_admin ?? false,
      });
    }
    setIsReady(true);
  }

  const logout = () => supabase.auth.signOut();

  const updateDisplayName = async (newName: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: newName })
      .eq("id", user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, displayName: newName } : null);
    }
    return error;
  };

  const refreshProfile = () => {
    if (user) loadProfile(user.id);
  };

  return {
    user,
    profile,
    username: profile?.username ?? null,
    displayName: profile?.displayName ?? null,
    isAdmin: profile?.isAdmin ?? false,
    isReady,
    logout,
    updateDisplayName,
    refreshProfile,
  };
}
