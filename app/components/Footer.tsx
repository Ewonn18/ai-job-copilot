import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-white/85 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              HireFlow AI
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Helping professionals discover better opportunities and apply with
              confidence.
            </p>
          </div>

          <nav aria-label="Footer" className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Quick Links
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-300 sm:justify-end">
              <li>
                <Link
                  href="#features"
                  className="transition-colors duration-200 hover:text-slate-900 dark:hover:text-white"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#dashboard"
                  className="transition-colors duration-200 hover:text-slate-900 dark:hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  className="transition-colors duration-200 hover:text-slate-900 dark:hover:text-white"
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {year} HireFlow AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
