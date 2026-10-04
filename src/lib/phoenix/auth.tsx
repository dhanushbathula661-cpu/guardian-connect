import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  clearStoredSession,
  cloudrailsGetUser,
  getStoredAccessToken,
  type CloudRailsUser,
} from "@/integrations/cloudrails/client";
import type { AppRole, Profile } from "./constants";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  cloudrailsUser: CloudRailsUser | null;
  profile: Profile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [cloudrailsUser, setCloudrailsUser] = useState<CloudRailsUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  const loadAccount = useCallback(async (userId: string | undefined, crUser?: CloudRailsUser | null) => {
    if (!userId && !crUser) {
      setProfile(null);
      setRole(null);
      return;
    }
    const targetId = userId || crUser?.id;
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", targetId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", targetId!),
      ]);
      if (profileResult.data) {
        setProfile(profileResult.data);
      } else if (crUser) {
        setProfile({
          id: crUser.id,
          email: crUser.email,
          full_name: (crUser.data?.full_name as string) || crUser.email?.split("@")[0] || "User",
          phone: crUser.data?.phone ?? null,
          avatar_url: null,
          is_active: true,
          emergency_contact_name: null,
          emergency_contact_email: null,
          emergency_contact_phone: null,
          created_at: crUser.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setProfile(null);
      }
      const roles = (roleResult.data ?? []).map((entry) => entry.role);
      setRole(roles.includes("admin") ? "admin" : "user");
    } catch {
      if (crUser) {
        setProfile({
          id: crUser.id,
          email: crUser.email,
          full_name: (crUser.data?.full_name as string) || crUser.email?.split("@")[0] || "User",
          phone: crUser.data?.phone ?? null,
          avatar_url: null,
          is_active: true,
          emergency_contact_name: null,
          emergency_contact_email: null,
          emergency_contact_phone: null,
          created_at: crUser.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setRole("user");
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        // 1. Check CloudRails Auth session first
        const crUser = await cloudrailsGetUser();
        const crToken = getStoredAccessToken();
        if (crUser && crToken && active) {
          setCloudrailsUser(crUser);
          const mockUser = {
            id: crUser.id,
            email: crUser.email,
            app_metadata: {},
            user_metadata: crUser.data || {},
            aud: "authenticated",
            created_at: crUser.created_at || new Date().toISOString(),
          } as unknown as User;

          const mockSession = {
            access_token: crToken,
            token_type: "bearer",
            user: mockUser,
          } as unknown as Session;

          setSession(mockSession);
          await loadAccount(crUser.id, crUser);
          return;
        }

        // 2. Fall back to Supabase session check
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session);
        await loadAccount(data.session?.user?.id);
      } catch (err) {
        console.error("[AuthProvider] Error initializing auth:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    // Safety timeout: ensure loading screen is dismissed after at most 3 seconds
    const fallbackTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 3000);

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      if (getStoredAccessToken()) {
        setLoading(false);
        return; // Keep CloudRails session if active
      }
      setSession(nextSession);
      setTimeout(() => {
        void loadAccount(nextSession?.user?.id).finally(() => active && setLoading(false));
      }, 0);
    });

    void initAuth();

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
      subscription.subscription.unsubscribe();
    };
  }, [loadAccount]);

  const refreshProfile = useCallback(async () => {
    await loadAccount(session?.user?.id, cloudrailsUser);
  }, [loadAccount, session?.user?.id, cloudrailsUser]);

  const signOut = useCallback(async () => {
    clearStoredSession();
    await supabase.auth.signOut();
    setCloudrailsUser(null);
    setProfile(null);
    setRole(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      cloudrailsUser,
      profile,
      role,
      isAuthenticated: Boolean(session || cloudrailsUser),
      isAdmin: role === "admin",
      refreshProfile,
      signOut,
    }),
    [loading, session, cloudrailsUser, profile, role, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
