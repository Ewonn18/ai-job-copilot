"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthGuard from "../components/AuthGuard";
import { useAppData } from "../context/AppDataContext";
import type { JobMatchResult } from "../context/AppDataContext";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";
import {
  saveJobMatch,
  loadJobMatches,
  type JobMatchRow,
} from "../lib/historyService";

const textareaClass =
  "w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all duration-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800";

const primaryButtonClass =
  "w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-slate-700 hover:shadow-[0_14px_26px_rgba(15,23,42,0.23)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:translate-y-0 dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

const resultCardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_18px_rgba(2,6,23,0.3)] dark:hover:border-slate-600";

const secondaryButtonClass =
  "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800";

export default function JobMatchPage() {
  const {
    extractedResumeText,
    jobDescription,
    setJobDescription,
    setJobMatchResult,
  } = useAppData();

  const [localJobDescription, setLocalJobDescription] =
    useState(jobDescription);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [jobMatchHistory, setJobMatchHistory] = useState<JobMatchRow[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const recentJobMatchHistory = jobMatchHistory.slice(0, 5);

  const hasResume = Boolean(extractedResumeText);

  useEffect(() => {
    let isMounted = true;
    if (supabaseConfigError || !supabase) return;
    const client = supabase;

    async function init() {
      const { data } = await client.auth.getSession();
      if (!isMounted || !data.session) return;
      const uid = data.session.user.id;
      setUserId(uid);
      setIsLoadingHistory(true);
      setHistoryError("");
      try {
        const history = await loadJobMatches(uid);
        if (isMounted) setJobMatchHistory(history);
      } catch {
        if (isMounted)
          setHistoryError(
            "Could not load match history. Please refresh to try again.",
          );
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    void init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session) {
        setUserId(session.user.id);
      } else {
        setUserId("");
        setJobMatchHistory([]);
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const canAnalyze = hasResume && localJobDescription.trim().length > 0;

  async function handleAnalyzeMatch() {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: localJobDescription,
          resumeText: extractedResumeText,
        }),
      });

      const data = (await response.json()) as
        | JobMatchResult
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in data && data.error
            ? data.error
            : "Unable to analyze. Please try again.";
        throw new Error(message);
      }

      const matchResult = data as JobMatchResult;
      setResult(matchResult);
      setJobDescription(localJobDescription);
      setJobMatchResult(matchResult);
      if (userId) {
        void saveJobMatch(userId, {
          jobDescription: localJobDescription,
          matchScore: matchResult.matchScore,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          suggestions: matchResult.suggestions,
        }).then((saved) => {
          if (saved) setJobMatchHistory((prev) => [saved, ...prev]);
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReopenMatch(item: JobMatchRow) {
    const restored: JobMatchResult = {
      matchScore: item.match_score,
      matchedSkills: item.matched_skills,
      missingSkills: item.missing_skills,
      suggestions: item.suggestions,
    };

    setLocalJobDescription(item.job_description);
    setResult(restored);
    setError("");
    setJobDescription(item.job_description);
    setJobMatchResult(restored);
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <section className="animate-fade-in mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Job Match
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
              Compare your resume against a job description to see how well your
              experience aligns.
            </p>

            {!hasResume ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 4h8m-8 4h8m-8 4h5m-8 8h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Zm11-4 2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-base font-medium text-slate-700 dark:text-slate-200">
                  No resume data found
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Upload and analyse your resume first so we can compare it
                  against job descriptions.
                </p>
                <Link
                  href="/resume-upload"
                  className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-[0_14px_26px_rgba(15,23,42,0.23)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400"
                >
                  Upload Resume
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-8">
                  <label
                    htmlFor="job-description"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Job Description
                  </label>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Paste the full job description for the role you are
                    targeting.
                  </p>
                  <textarea
                    id="job-description"
                    value={localJobDescription}
                    onChange={(e) => setLocalJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    rows={8}
                    className={`mt-3 ${textareaClass}`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeMatch}
                  disabled={!canAnalyze || isAnalyzing}
                  className={`mt-6 ${primaryButtonClass}`}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Match"}
                </button>

                {error ? (
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </p>
                ) : null}

                {result ? (
                  <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_14px_26px_rgba(2,6,23,0.35)]">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Match Result
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      Match Score:{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {result.matchScore}%
                      </span>
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <article className={resultCardClass}>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Matched Skills
                        </h3>
                        <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                          {result.matchedSkills.length > 0 ? (
                            result.matchedSkills.map((item) => (
                              <li key={item}>- {item}</li>
                            ))
                          ) : (
                            <li className="text-slate-400">None detected</li>
                          )}
                        </ul>
                      </article>

                      <article className={resultCardClass}>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Missing Skills
                        </h3>
                        <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                          {result.missingSkills.length > 0 ? (
                            result.missingSkills.map((item) => (
                              <li key={item}>- {item}</li>
                            ))
                          ) : (
                            <li className="text-emerald-600">
                              No gaps detected
                            </li>
                          )}
                        </ul>
                      </article>
                    </div>

                    <article className={`mt-4 ${resultCardClass}`}>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Suggestions
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                        {result.suggestions.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </article>
                  </section>
                ) : null}
              </>
            )}
          </section>

          {userId ? (
            <section className="mt-6 mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Recent Match History
              </h2>

              {historyError ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {historyError}
                </p>
              ) : null}

              {isLoadingHistory ? (
                <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Loading history...
                </p>
              ) : !historyError && recentJobMatchHistory.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200">
                    No matches yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your past job match results will appear here after your
                    first analysis.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 space-y-4">
                  {recentJobMatchHistory.map((item) => (
                    <li key={item.id} className={resultCardClass}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="max-w-xl truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.job_description
                            .split("\n")[0]
                            .slice(0, 80)
                            .trimEnd()}
                          {item.job_description.replace(/\s/g, "").length > 80
                            ? "..."
                            : ""}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(item.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReopenMatch(item)}
                            className={secondaryButtonClass}
                          >
                            Reopen
                          </button>
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                        Match Score:{" "}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.match_score}%
                        </span>
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Matched Skills
                          </p>
                          <ul className="mt-1.5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {item.matched_skills.length > 0 ? (
                              item.matched_skills
                                .slice(0, 3)
                                .map((s) => <li key={s}>- {s}</li>)
                            ) : (
                              <li className="text-slate-400">None detected</li>
                            )}
                            {item.matched_skills.length > 3 ? (
                              <li className="text-slate-400 dark:text-slate-500">
                                +{item.matched_skills.length - 3} more
                              </li>
                            ) : null}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Missing Skills
                          </p>
                          <ul className="mt-1.5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {item.missing_skills.length > 0 ? (
                              item.missing_skills
                                .slice(0, 3)
                                .map((s) => <li key={s}>- {s}</li>)
                            ) : (
                              <li className="text-emerald-600">
                                No gaps detected
                              </li>
                            )}
                            {item.missing_skills.length > 3 ? (
                              <li className="text-slate-400 dark:text-slate-500">
                                +{item.missing_skills.length - 3} more
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
