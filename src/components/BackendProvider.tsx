"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppSession,
  BackendChannel,
  BackendClient,
} from "@/lib/backend/client-types";

export type { BackendClient, BackendChannel } from "@/lib/backend/client-types";

type Ctx = {
  backend: BackendClient | null;
  session: AppSession | null;
  authReady: boolean;
  refreshSession: () => Promise<void>;
};

const BackendContext = createContext<Ctx>({
  backend: null,
  session: null,
  authReady: false,
  refreshSession: async () => {},
});

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) throw new Error("Session request failed");
      const data = (await res.json()) as {
        user: {
          id: string;
          email: string;
          displayName: string;
          avatarUrl?: string | null;
          roles?: string[];
        } | null;
      };
      setSession(
        data.user
          ? {
              user: {
                id: data.user.id,
                email: data.user.email,
                is_anonymous: false,
                app_metadata: {
                  provider: "email",
                  roles: data.user.roles ?? [],
                },
                user_metadata: {
                  full_name: data.user.displayName,
                  name: data.user.displayName,
                  avatar_url: data.user.avatarUrl ?? null,
                  picture: data.user.avatarUrl ?? null,
                },
              },
            }
          : null,
      );
    } catch {
      setSession(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  const client = useMemo<BackendClient>(
    () => ({
      auth: {
        getSession: async () => {
          const res = await fetch("/api/auth/session", { cache: "no-store" });
          const data = (await res.json()) as { user: AppSession["user"] | null };
          return { data: { session: data.user ? { user: data.user } : null } };
        },
        getUser: async () => {
          const res = await fetch("/api/auth/session", { cache: "no-store" });
          const data = (await res.json()) as { user: AppSession["user"] | null };
          return { data: { user: data.user } };
        },
        signOut: async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          await refreshSession();
        },
      },
      channel: (_name: string) => {
        const noop: BackendChannel = {
          on: () => noop,
          subscribe: () => noop,
          send: async () => "ok",
        };
        return noop;
      },
      removeChannel: async (_channel: BackendChannel) => {},
    }),
    [refreshSession],
  );

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        await refreshSession();
      } finally {
        if (cancelled) return;
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  useEffect(() => {
    window.addEventListener("spill-auth-changed", refreshSession);
    return () => window.removeEventListener("spill-auth-changed", refreshSession);
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      backend: client,
      session,
      authReady,
      refreshSession,
    }),
    [client, session, authReady, refreshSession],
  );

  return (
    <BackendContext.Provider value={value}>{children}</BackendContext.Provider>
  );
}

export function useBackend(): Ctx & {
  configured: boolean;
  remoteReady: boolean;
} {
  const ctx = useContext(BackendContext);
  const configured = true;
  const remoteReady = Boolean(configured && ctx.authReady && ctx.session);

  return useMemo(
    () => ({
      ...ctx,
      configured,
      remoteReady,
    }),
    [ctx, configured, remoteReady],
  );
}

export function useEnsureRemoteAuth(): () => Promise<void> {
  const { session } = useBackend();

  return useCallback(async () => {
    if (!session) {
      throw new Error("Sign in to continue.");
    }
  }, [session]);
}
