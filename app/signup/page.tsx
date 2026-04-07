"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  email?: string;
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

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function SignupPage() {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError("");
    setSuccessMessage("");
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
    setSuccessMessage("");

    if (supabaseConfigError) {
      console.error("[Signup] Supabase config error", {
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
        "[Signup] Supabase client unavailable after config validation",
      );
      setSubmitError(
        "Supabase client is unavailable. Restart the dev server and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      if (process.env.NODE_ENV === "development") {
        const authEndpoint = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")}/auth/v1/signup`;
        console.log("[Signup] Auth endpoint:", authEndpoint);
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        console.error("[Signup] Supabase auth error", {
          message: error.message,
          name: error.name,
          status: "status" in error ? error.status : undefined,
          code: "code" in error ? error.code : undefined,
          cause: "cause" in error ? error.cause : undefined,
        });

        const message = error.message.toLowerCase();
        const status =
          "status" in error && typeof error.status === "number"
            ? error.status
            : undefined;
        const code =
          "code" in error && typeof error.code === "string"
            ? error.code.toLowerCase()
            : "";
        if (
          status === 401 ||
          message.includes("invalid api key") ||
          message.includes("apikey") ||
          message.includes("invalid jwt") ||
          message.includes("project not found") ||
          code.includes("invalid_api_key")
        ) {
          setSubmitError(
            "Supabase rejected your API key (401). Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. If needed, switch from publishable key to the legacy anon key from Supabase API settings.",
          );
          return;
        }

        setSubmitError(error.message);
        return;
      }

      if (data.session) {
        router.push("/tracker");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Account created. Check your email for a confirmation link, then log in.",
      );
    } catch (error) {
      console.error("[Signup] Unexpected signUp failure", {
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
          "Network request to Supabase failed. Check your connection, browser blockers, and Supabase URL/key values.",
        );
        return;
      }

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("invalid api key") ||
        errorMessage.includes("apikey") ||
        errorMessage.includes("invalid jwt") ||
        errorMessage.includes("project not found")
      ) {
        setSubmitError(
          "Supabase rejected your API credentials. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. If needed, use the legacy anon key instead of the publishable key.",
        );
        return;
      }

      setSubmitError(
        "Signup failed unexpectedly. Please verify your Supabase config and try again.",
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
            Create your account
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Sign up to unlock resume analysis, job matching, and application
            tracking.
          </p>

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
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Confirm Password
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
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
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
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 transition-colors duration-200 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
