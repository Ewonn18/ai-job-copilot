"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthGuard from "../components/AuthGuard";
import { useAppData } from "../context/AppDataContext";
import { supabase, supabaseConfigError } from "../lib/supabaseClient";
import {
  saveResumeAnalysis,
  loadResumeAnalyses,
  type ResumeAnalysisRow,
} from "../lib/historyService";

type UploadState = {
  file: File | null;
  error: string;
};

type AnalysisResult = {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
  extractedText: string;
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const inputCardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_18px_rgba(2,6,23,0.3)]";

const primaryButtonClass =
  "w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-slate-700 hover:shadow-[0_14px_26px_rgba(15,23,42,0.23)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:translate-y-0 dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

const secondaryButtonClass =
  "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800";

function formatBytes(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [analyzeError, setAnalyzeError] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    error: "",
  });
  const { setFileMetadata, setExtractedResumeText, setResumeAnalysisResult } =
    useAppData();
  const hasValidFile = Boolean(uploadState.file && !uploadState.error);
  const [userId, setUserId] = useState("");
  const [resumeHistory, setResumeHistory] = useState<ResumeAnalysisRow[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const recentResumeHistory = resumeHistory.slice(0, 5);

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
        const history = await loadResumeAnalyses(uid);
        if (isMounted) setResumeHistory(history);
      } catch {
        if (isMounted)
          setHistoryError(
            "Could not load analysis history. Please refresh to try again.",
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
        setResumeHistory([]);
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function validateAndSetFile(file: File) {
    const isAcceptedType = ACCEPTED_TYPES.includes(file.type);
    const hasAcceptedExtension = /\.(pdf|docx)$/i.test(file.name);

    if (!isAcceptedType && !hasAcceptedExtension) {
      setUploadState({
        file: null,
        error: "Please upload a PDF or DOCX file.",
      });
      setAnalysisResult(null);
      setResumeAnalysisResult(null);
      setFileMetadata(null);
      setExtractedResumeText("");
      return;
    }

    setUploadState({ file, error: "" });
    setAnalyzeError("");
    // Clear stale context data when a new file is selected.
    setResumeAnalysisResult(null);
    setFileMetadata(null);
    setExtractedResumeText("");
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    validateAndSetFile(selectedFile);
    // Allow selecting the same file again after validation.
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    validateAndSetFile(droppedFile);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
  }

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleAnalyzeResume() {
    if (!uploadState.file) {
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError("");
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", uploadState.file);

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as
        | AnalysisResult
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in data && data.error
            ? data.error
            : "Unable to analyze resume right now. Please try again.";
        throw new Error(message);
      }

      const result = data as AnalysisResult;
      setAnalysisResult(result);
      // Persist to shared context so other pages can consume this data.
      setResumeAnalysisResult(result);
      setExtractedResumeText(result.extractedText);
      if (uploadState.file) {
        setFileMetadata({
          name: uploadState.file.name,
          size: uploadState.file.size,
          type: uploadState.file.type,
        });
        if (userId) {
          void saveResumeAnalysis(userId, {
            fileName: uploadState.file.name,
            extractedText: result.extractedText,
            matchScore: result.matchScore,
            strengths: result.strengths,
            missingSkills: result.missingSkills,
            suggestions: result.suggestions,
          }).then((saved) => {
            if (saved) setResumeHistory((prev) => [saved, ...prev]);
          });
        }
      }
    } catch (error) {
      setAnalyzeError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReopenAnalysis(item: ResumeAnalysisRow) {
    const restored: AnalysisResult = {
      matchScore: item.match_score,
      strengths: item.strengths,
      missingSkills: item.missing_skills,
      suggestions: item.suggestions,
      extractedText: item.extracted_text,
    };

    setAnalysisResult(restored);
    setAnalyzeError("");
    setExtractedResumeText(item.extracted_text);
    setResumeAnalysisResult(restored);
    setFileMetadata({ name: item.file_name, size: 0, type: "" });
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Upload Your Resume
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
              Add your latest resume to get instant AI feedback, improve role
              matching, and strengthen your applications.
            </p>

            <div
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`mt-8 rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-8 ${
                isDragActive
                  ? "border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
                  : "border-slate-300 bg-slate-50 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              }`}
            >
              <p className="text-base font-medium text-slate-800 dark:text-slate-200">
                Drag and drop your resume here
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                or
              </p>
              <button
                type="button"
                onClick={triggerFilePicker}
                className={`mt-4 ${secondaryButtonClass}`}
              >
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleInputChange}
                className="hidden"
              />
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Supported file types: PDF, DOCX
              </p>
            </div>

            {uploadState.error ? (
              <p className="mt-4 text-sm font-medium text-rose-600">
                {uploadState.error}
              </p>
            ) : null}

            {uploadState.file ? (
              <article className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_14px_26px_rgba(2,6,23,0.35)]">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Uploaded file
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {uploadState.file.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <span>Size: {formatBytes(uploadState.file.size)}</span>
                  <span>
                    Updated:{" "}
                    {new Date(
                      uploadState.file.lastModified,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </article>
            ) : null}

            <button
              type="button"
              onClick={handleAnalyzeResume}
              disabled={!hasValidFile || isAnalyzing}
              className={`mt-8 ${primaryButtonClass}`}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
            </button>

            {analyzeError ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {analyzeError}
              </p>
            ) : null}

            {analysisResult ? (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_14px_26px_rgba(2,6,23,0.35)]">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Analysis Result
                </h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Match Score:{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {analysisResult.matchScore}%
                  </span>
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <article className={inputCardClass}>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Strengths
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                      {analysisResult.strengths.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className={inputCardClass}>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Missing Skills
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                      {analysisResult.missingSkills.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </article>
                </div>

                <article className={`mt-4 ${inputCardClass}`}>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Suggestions
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {analysisResult.suggestions.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </article>
              </section>
            ) : null}
          </section>
          {userId ? (
            <section className="mt-6 mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Recent Analysis History
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
              ) : !historyError && recentResumeHistory.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200">
                    No analyses yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your past resume analyses will appear here after you run
                    your first analysis.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 space-y-4">
                  {recentResumeHistory.map((item) => (
                    <li key={item.id} className={inputCardClass}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.file_name}
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
                            onClick={() => handleReopenAnalysis(item)}
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
                            Strengths
                          </p>
                          <ul className="mt-1.5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {item.strengths.slice(0, 3).map((s) => (
                              <li key={s}>- {s}</li>
                            ))}
                            {item.strengths.length > 3 ? (
                              <li className="text-slate-400 dark:text-slate-500">
                                +{item.strengths.length - 3} more
                              </li>
                            ) : null}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Missing Skills
                          </p>
                          <ul className="mt-1.5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {item.missing_skills.slice(0, 3).map((s) => (
                              <li key={s}>- {s}</li>
                            ))}
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
