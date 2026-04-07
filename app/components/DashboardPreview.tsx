"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";

type Stat = {
  label: string;
  value: string;
  helper: string;
};

type Application = {
  id: string;
  company: string;
  role: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected" | "Saved";
  date: string;
};

const FALLBACK_APPLICATIONS: Application[] = [
  {
    id: "fallback-1",
    company: "Notion",
    role: "Product Designer",
    status: "Interviewing",
    date: "Apr 05, 2026",
  },
  {
    id: "fallback-2",
    company: "Stripe",
    role: "Frontend Engineer",
    status: "Applied",
    date: "Apr 03, 2026",
  },
  {
    id: "fallback-3",
    company: "Figma",
    role: "UX Engineer",
    status: "Offer",
    date: "Apr 01, 2026",
  },
];

const statusStyles: Record<Application["status"], string> = {
  Applied:
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Interviewing:
    "bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-800",
  Offer:
    "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/35 dark:text-emerald-200 dark:border-emerald-800",
  Rejected:
    "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/35 dark:text-rose-200 dark:border-rose-800",
  Saved:
    "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/35 dark:text-amber-200 dark:border-amber-800",
};

const TRACKER_STORAGE_KEY = "aji_tracker_entries";

const statCardClass =
  "rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_24px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/80 dark:shadow-[0_16px_28px_rgba(2,6,23,0.34)] dark:hover:border-slate-600 dark:hover:shadow-[0_20px_34px_rgba(2,6,23,0.44)]";

const applicationRowClass =
  "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_18px_rgba(2,6,23,0.3)] dark:hover:border-slate-600 dark:hover:shadow-[0_14px_22px_rgba(2,6,23,0.4)] sm:flex-row sm:items-center sm:justify-between";

function formatDisplayDate(isoDate: string) {
  if (!isoDate) {
    return "-";
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function DashboardPreview() {
  const { jobMatchResult } = useAppData();
  const [trackerEntries, setTrackerEntries] = useState<Application[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Array<{
        id?: string;
        company?: string;
        role?: string;
        status?: Application["status"];
        appliedDate?: string;
      }>;

      const normalized = parsed
        .filter((entry) => entry.company && entry.role)
        .map((entry, index) => ({
          id: entry.id ?? `entry-${index}`,
          company: entry.company ?? "Unknown Company",
          role: entry.role ?? "Unknown Role",
          status: entry.status ?? "Applied",
          date: formatDisplayDate(entry.appliedDate ?? ""),
        }));

      setTrackerEntries(normalized);
    } catch {
      setTrackerEntries([]);
    }
  }, []);

  const applications = trackerEntries.length
    ? trackerEntries.slice(0, 3)
    : FALLBACK_APPLICATIONS;

  const stats: Stat[] = useMemo(() => {
    const applicationsSent = trackerEntries.length || 48;
    const interviewCount =
      trackerEntries.filter((entry) => entry.status === "Interviewing")
        .length || 9;
    const matchScoreValue = jobMatchResult?.matchScore ?? 86;

    return [
      {
        label: "Applications Sent",
        value: applicationsSent.toString(),
        helper:
          trackerEntries.length > 0 ? "From your tracker" : "+6 this week",
      },
      {
        label: "Interviews",
        value: interviewCount.toString(),
        helper:
          trackerEntries.length > 0 ? "Currently interviewing" : "3 scheduled",
      },
      {
        label: "Match Score",
        value: `${matchScoreValue}%`,
        helper: jobMatchResult ? "Latest analysis" : "Strong fit overall",
      },
    ];
  }, [jobMatchResult, trackerEntries]);

  return (
    <section
      id="dashboard"
      className="rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10"
    >
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.6rem]">
          Dashboard Preview
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
          Keep your applications organized, monitor progress, and focus on the
          opportunities with the highest potential.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className={statCardClass}>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {stat.helper}
            </p>
          </article>
        ))}
      </div>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_14px_26px_rgba(2,6,23,0.35)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Recent Applications
          </h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Last 7 days
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {applications.map((application) => (
            <div key={application.id} className={applicationRowClass}>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {application.company}
                </p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                  {application.role}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[application.status]}`}
                >
                  {application.status}
                </span>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                  {application.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
