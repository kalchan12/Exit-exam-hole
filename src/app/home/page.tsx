'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';

/* ── animated counter hook ─────────────────────────────── */
function useCounter(target: number, duration = 1800, started: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return value;
}

/* ── feature cards data ─────────────────────────────────── */
const features = [
  {
    emoji: '📚',
    title: 'Massive Question Bank',
    desc: 'Hundreds of real past-paper questions organized by year, department, and topic — always expanding.',
    accent: 'primary',
  },
  {
    emoji: '⏱️',
    title: 'Timed Mock Exams',
    desc: 'Simulate exam conditions with full-length, strictly timed sessions to build endurance.',
    accent: 'secondary',
  },
  {
    emoji: '📊',
    title: 'Deep Analytics',
    desc: 'See exactly where you lose marks, broken down by topic and module.',
    accent: 'tertiary',
  },
  {
    emoji: '💡',
    title: 'Expert Explanations',
    desc: 'Detailed rationale for every question — not just the right answer.',
    accent: 'primary',
  },
  {
    emoji: '🎯',
    title: 'Personalized Progress',
    desc: 'Streaks, XP, and adaptive recommendations keep you on track until exam day.',
    accent: 'secondary',
  },
  {
    emoji: '📱',
    title: 'Study Anywhere',
    desc: 'Fully responsive — practice on your phone during commute or on desktop at home.',
    accent: 'tertiary',
  },
];

/* ── main component ─────────────────────────────────────── */
export default function HomePage() {
  const { user, isGuest, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const c1 = useCounter(40,    1600, statsVisible);
  const c2 = useCounter(5000,  2000, statsVisible);
  const c3 = useCounter(87,    1400, statsVisible);
  const c4 = useCounter(12000, 2200, statsVisible);

  /* Single mount effect — stable [] dep array, never changes */
  useEffect(() => {
    setMounted(true);

    // 1. Enable JS-gated CSS animations
    document.documentElement.classList.add('js-ready');

    // 2. Scroll-reveal: immediately show elements already in viewport,
    //    observe the rest
    const revealEls = document.querySelectorAll('[data-reveal]');
    const revealObs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          revealObs.unobserve(e.target);
        }
      }),
      { threshold: 0 }
    );
    revealEls.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight + 50) {
        (el as HTMLElement).classList.add('revealed');
      } else {
        revealObs.observe(el);
      }
    });

    // 3. Stats counter trigger
    const statsEl = statsRef.current;
    let statsObs: IntersectionObserver | null = null;
    if (statsEl) {
      statsObs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setStatsVisible(true);
            statsObs!.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      statsObs.observe(statsEl);
    }

    return () => {
      document.documentElement.classList.remove('js-ready');
      revealObs.disconnect();
      if (statsObs) statsObs.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount only

  /* Auth redirect — separate effect with its own deps */
  useEffect(() => {
    if (!loading && mounted && (user || isGuest)) {
      router.replace('/dashboard');
    }
  }, [user, isGuest, loading, mounted, router]);

  if (loading || user || isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">

      {/* ── background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="absolute w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'color-mix(in srgb, var(--secondary) 8%, transparent)', filter: 'blur(100px)', top: '55%', left: '10%', animation: 'breathe 14s ease-in-out infinite 1s' }} />
      </div>

      {/* ════════════════════════════════════
          NAVBAR
      ════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
        <div className="w-full max-w-6xl glass rounded-2xl shadow-lg px-5 py-3 flex items-center justify-between"
          style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.5), inset 1px 0 0 rgb(255 255 255 / 0.2), 0 4px 24px rgb(0 0 0 / 0.08), 0 1px 4px rgb(0 0 0 / 0.06)' }}>

          {/* logo */}
          <Link href="/home" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-fixed-dim flex items-center justify-center text-on-primary font-black text-sm shadow-md">
              EE
            </div>
            <span className="font-extrabold text-lg tracking-tight text-on-surface hidden sm:block">
              Exit<span className="text-primary">Exam</span>
            </span>
          </Link>

          {/* nav links — scroll to sections */}
          <div className="hidden md:flex items-center gap-1 bg-surface-container rounded-xl p-1">
            <a href="#features"
               className="px-4 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all">
              Features
            </a>
            <a href="#stats"
               className="px-4 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all">
              Stats
            </a>
            <a href="#cta"
               className="px-4 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all">
              Join Free
            </a>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* theme toggle — pill button with icon + label */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 text-sm font-medium"
              style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.5), 0 1px 3px rgb(0 0 0 / 0.08)' }}
            >
              {theme === 'dark' ? (
                <>
                  {/* sun icon */}
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="4" />
                    <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  <span className="hidden sm:inline text-xs">Light</span>
                </>
              ) : (
                <>
                  {/* moon icon */}
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
                  </svg>
                  <span className="hidden sm:inline text-xs">Dark</span>
                </>
              )}
            </button>

            <Link href="/auth/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all">
              Sign In
            </Link>
            <Link href="/auth/register"
              className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm hover:brightness-110 hover:shadow-md transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════
          HERO  — always visible, no reveal
      ════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* ── left: copy ── */}
          <div>
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container/70 text-on-primary-container text-[11px] font-bold uppercase tracking-widest mb-7"
              style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.25), 0 1px 3px rgb(66 49 207 / 0.15)' }}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Ethiopian University Exit Exam
            </div>

            <h1 className="hero-headline text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.08] mb-6">
              The Smartest Way<br />to{' '}
              <span className="relative inline-block">
                <span className="text-gradient">Pass Your Exit Exam</span>
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 to-transparent rounded-full" />
              </span>
            </h1>

            <p className="hero-subtext text-on-surface-variant text-base sm:text-[1.05rem] leading-relaxed max-w-lg mb-10">
              Practice with <span className="font-semibold text-on-surface">real past questions</span>, get instant explanations, track your progress, and walk into your exam with calm confidence.
            </p>

            <div className="hero-cta flex flex-wrap gap-3 mb-9">
              <Link href="/auth/register"
                className="group relative px-7 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <span className="relative z-10">Start Practicing Free</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
              <Link href="/auth/login"
                className="px-7 py-3.5 rounded-xl text-on-surface font-bold text-sm hover:text-primary hover:bg-primary-container/20 transition-all duration-300"
                style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.6), inset 1px 0 0 rgb(255 255 255 / 0.3), 0 2px 6px rgb(0 0 0 / 0.07), 0 1px 0 rgb(0 0 0 / 0.08)' }}>
                Sign In →
              </Link>
            </div>

            <div className="hero-cta flex items-center gap-3 text-sm text-on-surface-variant">
              <div className="flex -space-x-2">
                {(['#6366f1','#8b5cf6','#ec4899','#f97316'] as const).map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: c }}>
                    {['A','B','C','D'][i]}
                  </div>
                ))}
              </div>
              <span><strong className="text-on-surface">12,000+</strong> students already preparing</span>
            </div>
          </div>

          {/* ── right: mock card ── */}
          <div className="relative hidden lg:flex items-center justify-center py-10">
            <div className="relative w-full max-w-[360px] mx-auto">
              {/* main card */}
              <div className="card p-6 relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Today's Session</p>
                    <p className="text-xl font-black text-on-surface mt-0.5">Exit Exam 2023</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-primary-container flex items-center justify-center text-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3.5 mb-5">
                  {(['Data Structures', 'Algorithms', 'Networking'] as const).map((t, i) => (
                    <div key={t}>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className="text-on-surface">{t}</span>
                        <span className="text-primary font-bold">{[78,91,64][i]}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${[78,91,64][i]}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--on-surface) 8%, transparent)' }}>
                  <span className="text-on-surface-variant">34 of 100 answered</span>
                  <span className="font-bold text-secondary">+240 XP earned</span>
                </div>
              </div>

              {/* streak badge */}
              <div className="float-card absolute -top-6 -right-8 z-20 card px-4 py-3 flex items-center gap-2.5">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Streak</p>
                  <p className="text-lg font-black text-tertiary leading-none">14 days</p>
                </div>
              </div>

              {/* xp badge */}
              <div className="float-card-delayed absolute -bottom-6 -left-8 z-20 card px-4 py-3 flex items-center gap-2.5">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total XP</p>
                  <p className="text-lg font-black text-primary leading-none">4,820</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════
          STATS  (id="stats" for nav anchor)
      ════════════════════════════════════ */}
      <section id="stats" className="relative z-10 py-10" ref={statsRef}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: c1,  suffix: '+', label: 'Departments',  emoji: '🏫' },
              { val: c2,  suffix: '+', label: 'Questions',    emoji: '📝' },
              { val: c3,  suffix: '%', label: 'Pass Rate',    emoji: '🎯' },
              { val: c4,  suffix: '+', label: 'Students',     emoji: '👩‍🎓' },
            ].map(({ val, suffix, label, emoji }) => (
              <div key={label} className="card px-6 py-8 text-center transition-all duration-300">
                <span className="text-2xl mb-2 block">{emoji}</span>
                <p className="text-3xl sm:text-4xl font-black text-primary tabular-nums leading-none mb-1">
                  {val.toLocaleString()}{suffix}
                </p>
                <p className="text-sm font-medium text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FEATURES  (id="features" for nav anchor)
      ════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-24 md:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16" data-reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Why ExitExam</p>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Built specifically for the Ethiopian university exit exam curriculum.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const accentMap: Record<string, string> = {
                primary:   'bg-primary-container text-primary',
                secondary: 'bg-secondary-container/60 text-secondary',
                tertiary:  'bg-tertiary-container/50 text-tertiary',
              };
              return (
                <div
                  key={f.title}
                  data-reveal
                  className="feature-card group"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110 ${accentMap[f.accent]}`}>
                    {f.emoji}
                  </div>
                  <h3 className="text-base font-bold text-on-surface mb-2">{f.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════ */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
              Up and running in 3 steps
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5" data-reveal>
            {[
              { step: '01', title: 'Create an Account', desc: 'Sign up free in seconds — no credit card, no commitment.', icon: '👤' },
              { step: '02', title: 'Pick Your Exam',    desc: 'Choose from CS, Engineering, Health Sciences, and 40+ departments.', icon: '🎓' },
              { step: '03', title: 'Practice & Improve', desc: 'Answer questions, review explanations, track progress, repeat.', icon: '🚀' },
            ].map((s, i) => (
              <div
                key={s.step}
                className="relative card p-7 text-center overflow-hidden group"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-3 right-4 text-6xl font-black select-none pointer-events-none opacity-[0.04] text-on-surface">{s.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>
                <h3 className="font-bold text-on-surface mb-2">{s.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden sm:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-surface-container-high items-center justify-center"
                    style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.4), 0 1px 3px rgb(0 0 0 / 0.12)' }}>
                    <svg className="w-3 h-3 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          CTA  (id="cta" for nav anchor)
      ════════════════════════════════════ */}
      <section id="cta" className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto" data-reveal>
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e3a] via-[#2d1b69] to-[#0d0730]" />
            <div className="absolute inset-0 grid-bg opacity-[0.05]" />
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)' }} />

            <div className="relative z-10 px-8 sm:px-16 py-16 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest mb-7"
                style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.15), 0 1px 0 rgb(0 0 0 / 0.3)' }}>
                🎓 Free Forever
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-5 leading-tight">
                Your degree is within reach.<br />
                <span className="text-[#a78bfa]">Start preparing today.</span>
              </h2>
              <p className="text-white/60 max-w-lg mx-auto mb-10 text-base leading-relaxed">
                Join thousands of students across Ethiopia who trust ExitExam to get them across the finish line.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/auth/register"
                  className="group relative px-8 py-4 rounded-xl bg-white text-[#1a0e3a] font-bold text-sm shadow-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300">
                  <span className="relative z-10">Create Free Account →</span>
                  <div className="absolute inset-0 bg-violet-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="/auth/login"
                  className="px-8 py-4 rounded-xl text-white font-bold text-sm hover:bg-white/10 transition-all duration-300"
                  style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.15), inset 0 -1px 0 rgb(0 0 0 / 0.2), 0 2px 8px rgb(0 0 0 / 0.2)' }}>
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FOOTER
      ════════════════════════════════════ */}
      <footer className="relative z-10 px-4 sm:px-6 pb-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--on-surface) 8%, transparent)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary font-black text-[9px] shadow-sm">EE</div>
            <span className="text-xs text-on-surface-variant font-medium">ExitExam — Ethiopian University Exit Exam Preparation</span>
          </div>
          <div className="flex gap-5 text-xs text-on-surface-variant/60">
            <span>40+ Universities</span>
            <span>·</span>
            <span>Free &amp; Open</span>
            <span>·</span>
            <span>Built with ❤️ for Ethiopia</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
