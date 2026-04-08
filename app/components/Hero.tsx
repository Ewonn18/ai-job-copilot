import Link from "next/link";

export default function Hero() {
  return (
    <section className="grid items-center gap-10 rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-all duration-300 dark:border-slate-700 dark:from-slate-900/90 dark:to-slate-900/60 dark:shadow-[0_20px_44px_rgba(2,6,23,0.45)] sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-12">
      <div className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold tracking-[0.08em] text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          HireFlow AI Platform
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.55rem] lg:leading-[1.04]">
          Land Your Next Role Faster with HireFlow AI
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
          Build tailored resumes, draft role-specific cover letters, and track
          every application from one intelligent workspace.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3.5">
          <Link
            href="/resume-upload"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-[0_14px_26px_rgba(15,23,42,0.23)] dark:bg-sky-500 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(14,165,233,0.25)] dark:hover:bg-sky-400"
          >
            Get Started
          </Link>
          <Link
            href="/tracker"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            See Demo
          </Link>
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_8px_22px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_34px_rgba(2,6,23,0.42)] sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Application Insights
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            83% Match
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Your profile strongly matches Senior Product Designer roles.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_18px_rgba(2,6,23,0.3)] dark:hover:border-slate-600">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Resume Score
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                92/100
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_18px_rgba(2,6,23,0.3)] dark:hover:border-slate-600">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Applications This Week
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                14 Submitted
              </p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
