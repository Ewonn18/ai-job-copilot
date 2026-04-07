"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";

type AuthGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function AuthGuard({
  children,
  fallback = null,
}: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (supabaseConfigError || !supabase) {
      setIsAuthenticated(false);
      setIsChecking(false);
      router.replace("/login");
      return;
    }

    const client = supabase;

    async function verifySession() {
      const { data, error } = await client.auth.getSession();
      if (!isMounted) {
        return;
      }

      const hasSession = Boolean(data.session) && !error;
      setIsAuthenticated(hasSession);
      setIsChecking(false);

      if (!hasSession) {
        router.replace("/login");
      }
    }

    void verifySession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const hasSession = Boolean(session);
      setIsAuthenticated(hasSession);
      setIsChecking(false);

      if (!hasSession) {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (isChecking) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
