"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";

type FormValues = {
  email: string;
};

type FormErrors = {
  email?: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all duration-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:ring-offset-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800";

const primaryButtonClass =
  "w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-slate-700 hover:shadow-[0_14px_26px_rgba(15,23,42,0.23)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:translate-y-0 dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

export default function ForgotPasswordPage() {
  const [values, setValues] = useState<FormValues>({ email: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSubmitError(
        "Supabase is not configured correctly. Check your environment variables and restart the dev server.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!supabase) {
      setSubmitError(
        "Supabase client is unavailable. Restart the dev server and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email.trim(),
        { redirectTo },
      );

      if (error) {
        setSubmitError(error.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        "If an account exists for this email, a password reset link has been sent.",
      );
    } catch {
      setSubmitError(
        "Unable to send reset email right now. Please try again in a moment.",
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
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Enter your email and we&apos;ll send you a secure reset link.
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
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 transition-colors duration-200 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
            >
              Back to login
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
