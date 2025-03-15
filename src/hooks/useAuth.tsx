import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { cleanupSupabaseAuth } from "@/utils/supabaseUtils";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  hasTenant: boolean;
  tenantId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTenant, setHasTenant] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkTenantAccess(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change event:", event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkTenantAccess(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setHasTenant(true);
        setTenantId(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkTenantAccess = async (userId: string) => {
    try {
      // Check if user has pending request
      const { data: pendingRequest } = await supabase
        .from("tenant_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .single();

      if (pendingRequest) {
        setHasTenant(false);
        return;
      }

      // Check if user is assigned to any tenant
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", userId)
        .single();

      if (tenantUser) {
        setHasTenant(true);
        setTenantId(tenantUser.tenant_id);
      } else {
        setHasTenant(false);
        setTenantId(null);
      }
    } catch (error) {
      console.error("Error checking tenant access:", error);
      setHasTenant(false);
      setTenantId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const signOut = async () => {
    console.log("Signing out...");
    try {
      // First, sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }

      // Clean up any remaining auth data in localStorage
      cleanupSupabaseAuth();

      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
      setHasTenant(true);
      setTenantId(null);

      console.log("Successfully signed out, redirecting to auth page");

      // Force redirect to auth page
      navigate(ROUTES.AUTH, { replace: true });
    } catch (error) {
      console.error("Error during sign out:", error);
      // Still try to redirect even if there was an error
      navigate(ROUTES.AUTH, { replace: true });
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    hasTenant,
    tenantId,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
