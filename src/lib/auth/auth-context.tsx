import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, fetchRoles, touchPresence } from "@/services/profile-service";
import type { AppRole, Profile } from "@/types/domain";

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIdentity = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [nextProfile, nextRoles] = await Promise.all([
      fetchProfile(userId).catch(() => null),
      fetchRoles(userId).catch(() => [] as AppRole[]),
    ]);
    setProfile(nextProfile);
    setRoles(nextRoles);
  }, []);

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRoles([]);
      }
      if (nextSession?.user && event !== "TOKEN_REFRESHED") {
        void loadIdentity(nextSession.user.id);
      }
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadIdentity(data.session?.user.id);
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadIdentity]);

  // Keep the presence dot honest without polling the database.
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    void touchPresence(userId, "online");
    const onHidden = () => void touchPresence(userId, document.hidden ? "away" : "online");
    document.addEventListener("visibilitychange", onHidden);
    const interval = window.setInterval(
      () => void touchPresence(userId, document.hidden ? "away" : "online"),
      120_000,
    );
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.clearInterval(interval);
    };
  }, [session?.user.id]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      roles,
      isAdmin: roles.includes("admin"),
      loading,
      refreshProfile: async () => loadIdentity(session?.user.id),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw new Error(error.message);
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    }),
    [session, profile, roles, loading, loadIdentity, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

/** Convenience accessor for screens that are always rendered behind the gate. */
export function useCurrentUserId(): string {
  const { user } = useAuth();
  return user?.id ?? "";
}
