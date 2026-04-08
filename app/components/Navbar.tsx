"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/resume-upload", label: "Resume" },
  { href: "/job-match", label: "Job Match" },
  { href: "/cover-letter", label: "Cover Letter" },
  { href: "/tracker", label: "Tracker" },
];

const navLinkClass =
  "rounded-lg px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100";

const primaryCtaClass =
  "rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-slate-700 hover:shadow-[0_14px_28px_rgba(15,23,42,0.25)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_10px_28px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400";

const secondaryCtaClass =
  "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800";

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (supabaseConfigError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Navbar] Skipping session load due to config error", {
          reason: supabaseConfigError,
        });
      }
      setIsAuthenticated(false);
      return;
    }

    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[Navbar] Failed to read session", {
            message: error.message,
            name: error.name,
          });
        }
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(Boolean(data.session));
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    if (!supabase) {
      router.push("/login");
      router.refresh();
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-900 transition-colors duration-200 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
        >
          <span
            className="h-2.5 w-2.5 rounded-full bg-slate-900 shadow-[0_0_0_4px_rgba(15,23,42,0.08)] dark:bg-sky-300 dark:shadow-[0_0_0_4px_rgba(125,211,252,0.15)]"
            aria-hidden="true"
          />
          HireFlow AI
        </Link>

        <nav
          className="order-3 w-full sm:order-none sm:ml-auto sm:w-auto"
          aria-label="Primary"
        >
          <ul className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={navLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeToggle />

        {!isAuthenticated ? (
          <div className="ml-auto flex items-center gap-2 sm:ml-4">
            <Link href="/login" className={secondaryCtaClass}>
              Login
            </Link>
            <Link href="/signup" className={primaryCtaClass}>
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2 sm:ml-4">
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Authenticated
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className={primaryCtaClass}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
