import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import DashboardPreview from "./components/DashboardPreview";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 sm:gap-16 sm:px-6 lg:px-8 lg:py-16">
        <Hero />

        <FeaturesSection />

        <DashboardPreview />

        <section
          id="about"
          className="rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_40px_rgba(2,6,23,0.42)] sm:p-8 lg:p-10"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.6rem]">
            About
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
            HireFlow AI helps job seekers move faster while keeping every
            application intentional and personalized.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
