"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";

type FormValues = {
  email: string;
  password: string;
};

type FormErrors = {
  email?: string;
  password?: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all duration-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:ring-offset-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800";

const passwordInputClass = `${inputClass} pr-16`;

const toggleButtonClass =
  "absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100";

const primaryButtonClass =
  "w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-slate-700 hover:shadow-[0_14px_26px_rgba(15,23,42,0.23)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:translate-y-0 dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/tracker",
    [searchParams],
  );
  const passwordUpdated = useMemo(
    () => searchParams.get("passwordUpdated") === "1",
    [searchParams],
  );

  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    if (supabaseConfigError) {
      console.error("[Login] Supabase config error", {
        reason: supabaseConfigError,
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      });
      setSubmitError(
        "Supabase is not configured correctly. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!supabase) {
      console.error(
        "[Login] Supabase client unavailable after config validation",
      );
      setSubmitError(
        "Supabase client is unavailable. Restart the dev server and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        console.error("[Login] Supabase auth error", {
          message: error.message,
          name: error.name,
          status: "status" in error ? error.status : undefined,
          code: "code" in error ? error.code : undefined,
          cause: "cause" in error ? error.cause : undefined,
        });

        const message = error.message.toLowerCase();
        if (
          message.includes("invalid api key") ||
          message.includes("apikey") ||
          message.includes("invalid jwt") ||
          message.includes("project not found")
        ) {
          setSubmitError(
            "Supabase configuration appears invalid. Verify your project URL and anon key in .env.local.",
          );
          setIsSubmitting(false);
          return;
        }

        setSubmitError(error.message);
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("[Login] Unexpected signIn failure", {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        cause:
          error instanceof Error && "cause" in error
            ? String(error.cause)
            : undefined,
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        supabaseConfigError,
      });

      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : String(error);

      if (errorMessage.includes("failed to fetch")) {
        setSubmitError(
          "Supabase request failed to reach the server. Most commonly this is an invalid URL/key value, blocked network request, or browser extension interference.",
        );
        setIsSubmitting(false);
        return;
      }

      setSubmitError(
        "Login failed unexpectedly. Please verify your Supabase config and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="animate-fade-in mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Log in to continue tracking applications and improving job matches.
          </p>

          {passwordUpdated ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Password updated successfully. Please log in with your new
              password.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`mt-1.5 ${inputClass}`}
              />
              {errors.email ? (
                <p className="mt-1.5 text-sm font-medium text-rose-600">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className={toggleButtonClass}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p
                className={`mt-1.5 text-xs font-medium ${
                  values.password.length >= 6
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Use at least 6 characters.
              </p>
              {errors.password ? (
                <p className="mt-1.5 text-sm font-medium text-rose-600">
                  {errors.password}
                </p>
              ) : null}
              <div className="mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-slate-700 transition-colors duration-200 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {submitError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-slate-900 transition-colors duration-200 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
            >
              Create one
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
