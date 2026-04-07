"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";
import type { PostgrestError } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApplicationStatus =
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Saved";

type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  nextStep: string;
};

type ApplicationRow = {
  id: string;
  company: string;
  role: string;
  status: string;
  applied_date: string | null;
  next_step: string | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Saved",
];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Applied: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Interviewing: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200",
  Offer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200",
  Saved: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200",
};

const EMPTY_FORM: Omit<Application, "id"> = {
  company: "",
  role: "",
  status: "Applied",
  appliedDate: "",
  nextStep: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all duration-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800";

const primaryButtonClass =
  "rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-slate-700 hover:shadow-[0_14px_26px_rgba(15,23,42,0.23)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400";

const secondaryButtonClass =
  "rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800";

function toApplicationStatus(value: string): ApplicationStatus {
  return STATUS_OPTIONS.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : "Applied";
}

function mapRowToApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: toApplicationStatus(row.status),
    appliedDate: row.applied_date ?? "",
    nextStep: row.next_step ?? "",
  };
}

function getFriendlyError(
  operation: "load" | "save" | "update" | "delete",
  error?: PostgrestError | null,
) {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("permission") || message.includes("row-level")) {
    return "You do not have permission to perform this action.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network issue while contacting Supabase. Please check your connection and try again.";
  }

  if (operation === "load") {
    return "We could not load your applications right now. Please refresh and try again.";
  }

  if (operation === "save") {
    return "We could not save this application right now. Please try again.";
  }

  if (operation === "update") {
    return "We could not update this application right now. Please try again.";
  }

  return "We could not remove this application right now. Please try again.";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrackerPage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [dataError, setDataError] = useState("");
  const [entries, setEntries] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Application, "id">>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const firstInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadEntries(currentUserId: string) {
    const client = supabase;
    if (!client) {
      setDataError("Supabase is not configured correctly.");
      setEntries([]);
      return;
    }

    setIsLoadingEntries(true);
    setDataError("");

    try {
      const { data, error } = await client
        .from("applications")
        .select("id, company, role, status, applied_date, next_step")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) {
        setDataError(getFriendlyError("load", error));
        setEntries([]);
        return;
      }

      const rows = ((data ?? []) as ApplicationRow[]).map(mapRowToApplication);
      setEntries(rows);
    } catch {
      setDataError(getFriendlyError("load"));
      setEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  }

  // Redirect to login when user is not authenticated.
  useEffect(() => {
    let isMounted = true;

    if (supabaseConfigError) {
      setUserId("");
      setEntries([]);
      setIsAuthChecking(false);
      router.replace("/login?redirect=/tracker");
      return;
    }

    if (!supabase) {
      setUserId("");
      setEntries([]);
      setIsAuthChecking(false);
      router.replace("/login?redirect=/tracker");
      return;
    }

    const client = supabase;

    async function verifySession() {
      const { data, error } = await client.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error || !data.session) {
        setUserId("");
        setEntries([]);
        setIsAuthChecking(false);
        router.replace("/login?redirect=/tracker");
        return;
      }

      setUserId(data.session.user.id);
      void loadEntries(data.session.user.id);
      setIsAuthChecking(false);
    }

    void verifySession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUserId("");
        setEntries([]);
        setIsAuthChecking(false);
        router.replace("/login?redirect=/tracker");
        return;
      }

      setUserId(session.user.id);
      void loadEntries(session.user.id);
      setIsAuthChecking(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Focus the first input when the form opens.
  useEffect(() => {
    if (showForm) {
      firstInputRef.current?.focus();
    }
  }, [showForm]);

  // Clear the success timeout on unmount.
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  function showSuccess(message: string) {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(""), 3000);
  }

  function handleOpenForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setDataError("");
    setShowForm(true);
  }

  function handleOpenEdit(entry: Application) {
    setForm({
      company: entry.company,
      role: entry.role,
      status: entry.status,
      appliedDate: entry.appliedDate,
      nextStep: entry.nextStep,
    });
    setEditingId(entry.id);
    setFormError("");
    setDataError("");
    setShowForm(true);
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.company.trim() || !form.role.trim()) {
      setFormError("Company and Role are required.");
      return;
    }

    if (!userId) {
      setFormError("You must be logged in to save applications.");
      return;
    }

    const client = supabase;
    if (!client) {
      setFormError("Supabase is not configured correctly.");
      return;
    }

    setIsSaving(true);
    setDataError("");

    const payload = {
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      applied_date: form.appliedDate || null,
      next_step: form.nextStep.trim() || null,
    };

    try {
      if (editingId) {
        // UPDATE existing entry
        const { data, error } = await client
          .from("applications")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId)
          .select("id, company, role, status, applied_date, next_step")
          .single();

        if (error || !data) {
          setFormError(getFriendlyError("update", error));
          return;
        }

        const updated = mapRowToApplication(data as ApplicationRow);
        setEntries((prev) =>
          prev.map((e) => (e.id === editingId ? updated : e)),
        );
      } else {
        // INSERT new entry
        const { data, error } = await client
          .from("applications")
          .insert({ user_id: userId, ...payload })
          .select("id, company, role, status, applied_date, next_step")
          .single();

        if (error || !data) {
          setFormError(getFriendlyError("save", error));
          return;
        }

        const newEntry = mapRowToApplication(data as ApplicationRow);
        setEntries((prev) => [newEntry, ...prev]);
      }

      showSuccess(editingId ? "Application updated." : "Application saved.");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setFormError("");
    } catch {
      setFormError(getFriendlyError(editingId ? "update" : "save"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!userId) {
      setDataError("You must be logged in to remove applications.");
      return;
    }

    const client = supabase;
    if (!client) {
      setDataError("Supabase is not configured correctly.");
      return;
    }

    setDeletingId(id);
    setDataError("");
    try {
      const { error } = await client
        .from("applications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setDataError(getFriendlyError("delete", error));
        return;
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));
      showSuccess("Application removed.");
    } catch {
      setDataError(getFriendlyError("delete"));
    } finally {
      setDeletingId(null);
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Checking authentication...
            </p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="animate-fade-in mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Tracker
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
                Monitor applications, interview stages, and follow-ups in one
                organized workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenForm}
              disabled={isSaving || !!deletingId}
              className={`shrink-0 self-start ${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              + Add Application
            </button>
          </div>

          {/* Add form */}
          {showForm ? (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_14px_26px_rgba(2,6,23,0.35)]"
            >
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingId ? "Edit Application" : "New Application"}
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Company <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="company"
                    name="company"
                    type="text"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="e.g. Stripe"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    value={form.role}
                    onChange={handleChange}
                    placeholder="e.g. Frontend Engineer"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={`mt-1.5 ${inputClass}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="appliedDate"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Applied Date
                  </label>
                  <input
                    id="appliedDate"
                    name="appliedDate"
                    type="date"
                    value={form.appliedDate}
                    onChange={handleChange}
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="nextStep"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Next Step
                  </label>
                  <input
                    id="nextStep"
                    name="nextStep"
                    type="text"
                    value={form.nextStep}
                    onChange={handleChange}
                    placeholder="e.g. Technical interview on Thursday"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>
              </div>

              {formError ? (
                <p className="mt-3 text-sm font-medium text-rose-600">
                  {formError}
                </p>
              ) : null}

              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400`}
                >
                  {isSaving
                    ? editingId
                      ? "Updating..."
                      : "Saving..."
                    : editingId
                      ? "Update"
                      : "Save"}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {/* Table */}
          {dataError ? (
            <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {dataError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300">
              {successMessage}
            </p>
          ) : null}

          {isLoadingEntries ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Loading your applications...
              </p>
            </div>
          ) : null}

          {!isLoadingEntries && entries.length > 0 ? (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_30px_rgba(2,6,23,0.4)]">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                  <tr>
                    {[
                      "Company",
                      "Role",
                      "Status",
                      "Applied",
                      "Next Step",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {entry.company}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {entry.role}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[entry.status]}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {entry.appliedDate
                          ? new Date(entry.appliedDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                        {entry.nextStep || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(entry)}
                            disabled={isSaving || !!deletingId}
                            className="text-xs font-medium text-slate-400 transition-colors hover:text-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={!!deletingId || isSaving}
                            className="text-xs font-medium text-slate-400 transition-colors hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === entry.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !isLoadingEntries &&
            !showForm && (
              <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 8h6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-200">
                  No applications yet
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Keep your search organized by adding your first application.
                </p>
                <button
                  type="button"
                  onClick={handleOpenForm}
                  className={`mt-5 inline-flex ${primaryButtonClass}`}
                >
                  Add Application
                </button>
              </div>
            )
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
