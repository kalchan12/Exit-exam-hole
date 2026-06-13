'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProgress } from '@/lib/progressManager';

export default function QuestionsPage() {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(() => getProgress());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-10 animate-in py-4 relative">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-accent-purple transition-all duration-300 group"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Return to Dashboard
      </Link>

      <div className="flex flex-col items-center text-center gap-5 py-20">
        <div className="text-6xl mb-2 opacity-60">📝</div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
          Practice <span className="bg-gradient-to-r from-accent-purple via-purple-400 to-indigo-400 bg-clip-text text-transparent">Questions</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium max-w-md">
          Practice questions are not available yet. Head over to the Exam section to practice with authentic exit exam questions.
        </p>
        <Link
          href="/exam"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-purple to-indigo-500 text-white font-black text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:-translate-y-0.5"
        >
          Go to Exams
        </Link>
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-2xl px-5 py-3 mt-4">
          <span className="text-lg">⚡</span>
          <div>
            <span className="text-gray-900 dark:text-white font-black text-sm tabular-nums">{progress.xp.toLocaleString()}</span>
            <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block leading-tight">XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
