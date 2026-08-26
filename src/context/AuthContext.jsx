import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function mergeProfileIntoUser(user, profile) {
  if (!user) {
    return null;
  }

  if (!profile) {
    return user;
  }

  return {
    ...user,
    user_metadata: {
      ...(user.user_metadata || {}),
      display_name:
        profile.display_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.name ||
        "",
      username:
        profile.username ||
        user.user_metadata?.username ||
        "",
      bio:
        profile.bio ??
        user.user_metadata?.bio ??
        "",
      avatar_url:
        profile.avatar_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        "",
    },
  };
}

async function loadProfileForUser(authUser) {
  if (!authUser?.id) {
    return authUser;
  }

  try {
    const {
      data: profile,
      error,
    } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, bio, avatar_url"
      )
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Could not load user profile:",
        error
      );

      return authUser;
    }

    return mergeProfileIntoUser(
      authUser,
      profile
    );
  } catch (error) {
    console.error(
      "Unexpected profile loading error:",
      error
    );

    return authUser;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Supabase session error:",
          error
        );

        setSession(null);
        setUser(null);
        setLoading(false);

        return;
      }

      if (!currentSession?.user) {
        setSession(null);
        setUser(null);
        setLoading(false);

        return;
      }

      const enrichedUser =
        await loadProfileForUser(
          currentSession.user
        );

      if (!mounted) {
        return;
      }

      setSession(currentSession);
      setUser(enrichedUser);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) {
          return;
        }

        setSession(currentSession);

        if (!currentSession?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        /*
         * USER_UPDATED is triggered when profile metadata
         * changes through supabase.auth.updateUser().
         *
         * We also reload the real profiles table so the
         * avatar, name, username and bio stay synchronized.
         */
        if (
          event === "USER_UPDATED" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION"
        ) {
          setTimeout(async () => {
            if (!mounted) {
              return;
            }

            const enrichedUser =
              await loadProfileForUser(
                currentSession.user
              );

            if (!mounted) {
              return;
            }

            setUser(enrichedUser);
            setLoading(false);
          }, 0);

          return;
        }

        setUser(currentSession.user);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (!user?.id) {
      return;
    }

    const {
      data: { user: freshAuthUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error(
        "Could not refresh auth user:",
        authError
      );
      return;
    }

    const enrichedUser =
      await loadProfileForUser(
        freshAuthUser || user
      );

    setUser(enrichedUser);

    return enrichedUser;
  }

  async function signUp({
    email,
    password,
    name,
    username,
  }) {
    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24);

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: name.trim(),
            username: cleanUsername,
          },
          emailRedirectTo:
            window.location.origin,
        },
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signIn(email, password) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setUser(null);
  }

  const value = {
    session,
    user,
    loading,
    isAuthenticated: Boolean(user),
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}