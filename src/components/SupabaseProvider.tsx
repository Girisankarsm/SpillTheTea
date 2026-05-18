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

      let next = existing;
      if (!next) {
        const { data, error } = await sb.auth.signInAnonymously();
        if (error) console.error("[meet-greet] Anonymous sign-in:", error.message);
        next = data.session ?? null;
      }

      if (!cancelled) setSession(next);
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
    configured && ctx.supabase && ctx.authReady && ctx.session,
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
  const { supabase } = useSupabase();

  return useCallback(async () => {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) await supabase.auth.signInAnonymously();
  }, [supabase]);
}
