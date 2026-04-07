"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";

type FormValues = {
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  password?: string;
  confirmPassword?: string;
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

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (supabaseConfigError || !supabase) {
      setIsCheckingSession(false);
      return;
    }

    const client = supabase;

    async function checkSession() {
      const { data } = await client.auth.getSession();
      if (!isMounted) return;
      setHasRecoverySession(Boolean(data.session));
      setIsCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
        setHasRecoverySession(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (supabaseConfigError) {
      setSubmitError(
        "Supabase is not configured correctly. Check your environment variables and restart the dev server.",
      );
      return;
    }

    if (!supabase) {
      setSubmitError(
        "Supabase client is unavailable. Restart the dev server and try again.",
      );
      return;
    }

    if (!hasRecoverySession) {
      setSubmitError(
        "This reset link is invalid or expired. Request a new password reset email.",
      );
      return;
    }

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        setSubmitError(error.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Password updated. Redirecting you to login...");
      setTimeout(() => {
        router.push("/login?passwordUpdated=1");
        router.refresh();
      }, 1200);
    } catch {
      setSubmitError(
        "Unable to update password right now. Please try again in a moment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="animate-fade-in mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Choose a new password
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Set a new password for your account.
          </p>

          {!hasRecoverySession && !isCheckingSession ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Open this page from the reset email link. If the link expired,
              request a new one.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                New Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
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
              {errors.password ? (
                <p className="mt-1.5 text-sm font-medium text-rose-600">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Confirm New Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showConfirmPassword}
                  className={toggleButtonClass}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-1.5 text-sm font-medium text-rose-600">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            {submitError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {submitError}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                isSubmitting || isCheckingSession || !hasRecoverySession
              }
              className={primaryButtonClass}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
            Need another link?{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-slate-900 transition-colors duration-200 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
            >
              Request password reset
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
