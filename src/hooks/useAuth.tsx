import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { ROUTES } from "@/lib/constants";
import { cleanupSupabaseAuth, getRedirectUri } from "@/utils/supabaseUtils";
import { toast } from "sonner";
import { Provider } from "@supabase/supabase-js";
import { buildAzureOAuthUrl } from "../utils/oAuth/oAuthAzure";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_onboarded: boolean;
}

interface SignInParams {
  email: string;
  password: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  handleEmailSignIn: (params: SignInParams) => Promise<void>;
  handleEmailSignUp: (params: SignInParams) => Promise<void>;
  handleOAuthSignIn: (provider: Provider) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
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

  const signInUser = useCallback(async () => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        fetchProfile(data.session.user.id);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const handleEmailSignIn = useCallback(
    async ({ email, password }) => {
      if (!email || !password) {
        toast.error("Please enter both email and password");
        return;
      }
      setIsLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Sign in error:", error);
          throw error;
        }

        await fetchProfile(data.session.user.id);

        toast.success("Signed in successfully");
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Error signing in:", error);
        toast.error(error.message || "Invalid login credentials");
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const handleEmailSignUp = useCallback(async ({ email, password }) => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUri(),
        },
      });

      if (error) throw error;

      toast.success(
        "Sign-up successful! Please check your email for verification."
      );
    } catch (error) {
      console.error("Error signing up:", error);
      toast.error(error.message || "An error occurred during sign-up");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOAuthSignIn = useCallback(async (provider: Provider) => {
    try {
      setIsLoading(true);
      sessionStorage.removeItem("integration_return_url");

      if (provider === "azure") {
        const url = await buildAzureOAuthUrl();
        window.location.href = url;
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getRedirectUri() },
      });

      if (error) throw error;
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      toast.error(error.message || `Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    signInUser();
  }, [signInUser]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      setSession(supabaseSession);
      setUser(supabaseSession?.user ?? null);

      if (!supabaseSession?.user) {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }

      cleanupSupabaseAuth();

      setSession(null);
      setUser(null);
      setProfile(null);

      navigate(ROUTES.AUTH, { replace: true });
    } catch (error) {
      console.error("Error during sign out:", error);
      navigate(ROUTES.AUTH, { replace: true });
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signOut,
    handleEmailSignIn,
    handleOAuthSignIn,
    handleEmailSignUp,
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
