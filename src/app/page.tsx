'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Past Exam Questions',
    description: 'Access authentic exit exam papers from 2015 through 2018 across 40+ departments.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Timed Practice',
    description: 'Simulate real exam conditions with a built-in timer — 60 seconds per question, just like the real thing.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Progress Tracking',
    description: 'Track accuracy by topic, build streaks, earn XP, and level up as you master each subject.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: 'Study Resources',
    description: 'Browse notes, learning bytes, and PDF documents curated per department to supplement your prep.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Instant Feedback',
    description: 'Get detailed explanations for every answer. Learn why the correct answer is right and others are wrong.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'Community Stats',
    description: 'Compare your performance, climb the leaderboard, and see where you stand among peers.',
  },
];

const stats = [
  { value: '40+', label: 'Departments' },
  { value: '500+', label: 'Exam Questions' },
  { value: '8', label: 'Exam Years' },
  { value: '100%', label: 'Free Access' },
];

export default function LandingPage() {
  const { user, isGuest, loading } = useAuth();
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

  if (loading || user || isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b1e]">
        <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080f] text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.05)_0%,_transparent_50%)]" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent-purple/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(124,58,237,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all duration-300">
            EE
          </div>
          <span className="font-black text-xl tracking-tight text-white">
            Exit<span className="text-accent-purple">Exam</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-accent-purple to-indigo-500 text-white hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-bold uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
          Ethiopian Exit Exam Preparation
        </div>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
          Ace Your
          <br />
          <span className="bg-gradient-to-r from-accent-purple via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Exit Exam
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Practice with authentic past exit exam questions from 40+ Ethiopian departments.
          Timed simulations, detailed explanations, and progress tracking &mdash; all free.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/register"
            className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-purple to-indigo-500 text-white font-bold text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 overflow-hidden"
          >
            <span className="relative z-10">Start Practicing Free</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-4 rounded-2xl border border-white/10 bg-white/[0.03] text-white font-bold text-sm uppercase tracking-widest transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Built to help Ethiopian university students prepare with real past exam data.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div
              key={f.title}
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-accent-purple/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple mb-4 group-hover:scale-110 group-hover:bg-accent-purple/20 transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-purple/[0.12] via-accent-purple/[0.04] to-transparent border border-accent-purple/20 p-12 sm:p-16 text-center">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent-purple/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-[120px]" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Ready to Pass?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8 text-sm">
              Join thousands of Ethiopian students preparing for their exit exams. No credit card required.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-purple to-indigo-500 text-white font-bold text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-purple to-indigo-500 flex items-center justify-center text-white font-black text-[8px]">
              EE
            </div>
            <span className="text-xs text-gray-500">
              ExitExam &mdash; Ethiopian Exit Exam Preparation
            </span>
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            <span>Built for Ethiopian Universities</span>
            <span>Free &amp; Open</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
