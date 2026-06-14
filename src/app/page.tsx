'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Comprehensive Library',
    description: 'Access hundreds of past papers and curated study materials organized by department and module.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Timed Mock Exams',
    description: 'Simulate the real testing environment with strictly timed sessions to build your endurance.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Performance Analytics',
    description: 'Identify your weak points instantly with detailed breakdowns of your scores by topic.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: 'Expert Explanations',
    description: "Don't just see the right answer; understand why it's right with detailed rationale for hard questions.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Study Anywhere',
    description: 'Fully responsive design lets you practice on your phone during your commute or on desktop.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'Always Up-to-Date',
    description: 'Our content team constantly updates questions to align with the latest curriculum shifts.',
  },
];

const stats = [
  { value: '40+', label: 'Departments' },
  { value: '5,000+', label: 'Practice Questions' },
  { value: '87%', label: 'Pass Rate' },
  { value: '12k+', label: 'Active Students' },
];

function useScrollReveal(mounted: boolean) {
  useEffect(() => {
    if (!mounted) return;
    const els = document.querySelectorAll('.fade-up');
    const observers: IntersectionObserver[] = [];
    els.forEach(el => {
      const o = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            o.unobserve(entry.target);
          }
        },
        { threshold: 0.1 }
      );
      o.observe(el);
      observers.push(o);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [mounted]);
}

export default function LandingPage() {
  const { user, isGuest, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (user || isGuest) {
        router.replace('/dashboard');
      }
    }
  }, [user, isGuest, loading, router, mounted]);

  useScrollReveal(mounted && !loading && !user && !isGuest);

  if (loading || user || isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background overflow-hidden selection:bg-primary-container selection:text-on-primary-container">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 grid-bg opacity-[0.4]" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4 max-w-7xl xl:mx-auto rounded-2xl bg-surface/80 backdrop-blur-xl border border-primary/10 shadow-ambient">
          <div className="flex items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm">
                EE
              </div>
              <span className="font-bold text-xl text-on-surface">
                Exit<span className="text-primary">Exam</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Features</a>
              <a href="#stats" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Stats</a>
              <a href="#cta" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Get Started</a>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant border border-primary/10 hover:bg-surface-container-high hover:text-on-surface transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex px-5 py-2 rounded-lg text-sm font-semibold text-on-surface-variant border border-primary/10 hover:bg-surface-container-high hover:text-on-surface transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm hover:shadow-md hover:brightness-110 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-20 md:pb-28 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Ethiopian Exit Exam Preparation
          </div>

          <h1 className="hero-headline text-5xl sm:text-6xl md:text-[4.5rem] font-extrabold tracking-tight leading-[1.1] mb-6">
            Ace Your Exit Exam.<br />
            <span className="text-primary">Study Smarter.</span>
          </h1>

          <p className="hero-subtext text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            The most reliable platform for Ethiopian university exit exams. Practice with actual questions, track your progress, and walk into your exam with calm confidence.
          </p>

          <div className="hero-cta flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-8 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Start Practicing Free
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3.5 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all"
            >
              Sign In
            </Link>
          </div>

          <div className="hero-cta mt-8 flex items-center justify-center gap-2 text-on-surface-variant text-sm">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            Trusted by students across 40+ Universities
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section id="stats" className="relative z-10 fade-up">
        <div className="w-full bg-surface-container-high border-y border-outline-variant/50">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-cell px-6 py-10 sm:py-12 text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-on-surface-variant font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-16 fade-up">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">
            Built specifically for the Ethiopian higher education curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="feature-card fade-up"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center text-primary mb-4">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">{f.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative z-10 max-w-4xl mx-auto px-6 pb-24 md:pb-32 fade-up">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-10 py-16 sm:p-16 text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-on-primary/5 rounded-full blur-[150px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-primary mb-4">
              Ready to Pass?
            </h2>
            <p className="text-on-primary/80 max-w-lg mx-auto mb-8">
              Join thousands of students securing their degrees with ExitExam.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/auth/register"
                className="px-8 py-3.5 rounded-xl bg-surface text-primary font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
              >
                Create Free Account
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-3.5 rounded-xl border-2 border-on-primary/30 text-on-primary font-bold text-sm hover:bg-on-primary/10 active:scale-[0.98] transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 pb-8 fade-up">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-outline-variant/50">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-on-primary font-bold text-[8px]">
              EE
            </div>
            <span className="text-xs text-on-surface-variant">
              ExitExam &mdash; Ethiopian Exit Exam Preparation
            </span>
          </div>
          <div className="flex gap-6 text-xs text-on-surface-variant">
            <span>Built for Ethiopian Universities</span>
            <span>Free &amp; Open</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
