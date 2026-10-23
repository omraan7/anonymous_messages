"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { endpoints, SESSION_EXPIRED_EVENT, type User } from "./api";

type Ctx = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
};
const AuthCtx = createContext<Ctx | null>(null);

// The single source of truth for "who is logged in" on the client. The session itself
// lives in HttpOnly cookies the backend owns; this only mirrors the public profile.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session after a reload (the API client refreshes an expired access token itself).
  useEffect(() => {
    let cancelled = false;
    endpoints
      .me()
      .then((u) => !cancelled && setUserState(u))
      .catch(() => !cancelled && setUserState(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh failed somewhere -> drop client state and go to login (once).
  useEffect(() => {
    const onExpired = () => {
      setUserState((prev) => {
        if (prev) router.replace("/login?expired=1");
        return null;
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router]);

  const setUser = useCallback((u: User | null) => setUserState(u), []);

  const logout = useCallback(async () => {
    try {
      await endpoints.logout();
    } catch {
      /* cookies are cleared server-side on success; on failure we still drop local state */
    }
    setUserState(null); // clears user-specific UI state (components are keyed by user id)
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, loading, setUser, logout }), [user, loading, setUser, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
