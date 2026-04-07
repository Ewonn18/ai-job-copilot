import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: "Resume Match Analysis",
    description:
      "Score your resume against job descriptions and get clear suggestions to improve role fit.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          d="M8 7h8M8 11h8M8 15h5M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm10.5 13.5 1.5 1.5 3-3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Cover Letter Generator",
    description:
      "Generate polished, personalized cover letters in seconds with tone and role-aware AI prompts.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          d="M4 6a2 2 0 0 1 2-2h8l6 6v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm10 0v4h4M8 13h8M8 17h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Application Tracker",
    description:
      "Track applications, interviews, and follow-ups in one organized view so nothing slips through.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 8h3v3H8v-3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10"
    >
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.6rem]">
          Powerful Features
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
          Everything you need to optimize your job search workflow, stay
          consistent, and apply with confidence.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="group rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_18px_30px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/80 dark:shadow-[0_16px_28px_rgba(2,6,23,0.34)] dark:hover:border-slate-600 dark:hover:shadow-[0_20px_36px_rgba(2,6,23,0.44)]"
          >
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-slate-900 group-hover:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-sky-500 dark:group-hover:text-slate-950">
              {feature.icon}
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-7">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
