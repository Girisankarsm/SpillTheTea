"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isGoogleSignedIn } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Ctx = {
  supabase: SupabaseClient | null;
  session: Session | null;
  authReady: boolean;
};

const SupabaseContext = createContext<Ctx>({
  supabase: null,
  session: null,
  authReady: false,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => createBrowserSupabaseClient(), []);
  const needsRemoteAuth = Boolean(client);

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(() => !needsRemoteAuth);

  useEffect(() => {
    if (!client) return;

    const sb = client;

    let cancelled = false;

    async function bootstrap() {
      const {
        data: { session: existing },
      } = await sb.auth.getSession();
      if (cancelled) return;

      if (!cancelled) setSession(existing);
      if (!cancelled) setAuthReady(true);
    }

    queueMicrotask(() => {
      void bootstrap();
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo(
    () => ({
      supabase: client,
      session,
      authReady,
    }),
    [client, session, authReady],
  );

  return (
    <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabase(): Ctx & {
  configured: boolean;
  remoteReady: boolean;
} {
  const ctx = useContext(SupabaseContext);
  const configured = useMemo(() => isSupabaseConfigured(), []);
  const remoteReady = Boolean(
    configured &&
      ctx.supabase &&
      ctx.authReady &&
      isGoogleSignedIn(ctx.session),
  );

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
  const { supabase, session } = useSupabase();

  return useCallback(async () => {
    if (!supabase) return;
    const {
      data: { session: current },
    } = await supabase.auth.getSession();
    if (!current || !isGoogleSignedIn(current)) {
      throw new Error("Sign in with Google to continue.");
    }
    if (!session) {
      throw new Error("Sign in with Google to continue.");
    }
  }, [supabase, session]);
}
