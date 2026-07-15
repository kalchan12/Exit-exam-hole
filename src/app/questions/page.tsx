'use client';

import { useState } from 'react';
import { useMounted } from '@/hooks/useMounted';
import Link from 'next/link';
import { getProgress } from '@/lib/progressManager';
import { ChevronLeft, Zap } from 'lucide-react';

export default function QuestionsPage() {
  const mounted = useMounted();
  const [progress] = useState(() => getProgress());


  if (!mounted) return null;

  return (
    <div className="space-y-8 py-4">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-label-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>

      <div className="flex flex-col items-center text-center gap-5 py-16">
        <div className="text-5xl mb-2 opacity-60">📝</div>
        <h1 className="text-headline-2xl sm:text-headline-3xl font-bold text-on-surface tracking-tight">
          Practice <span className="text-gradient">Questions</span>
        </h1>
        <p className="text-body-base text-on-surface-variant max-w-md">
          Practice questions are not available yet. Head over to the Exam section to practice with authentic exit exam questions.
        </p>
        <Link
          href="/exam"
          className="btn-primary"
        >
          Go to Exams
        </Link>
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant mt-4">
          <Zap className="w-4 h-4 text-primary" />
          <div>
            <span className="text-sm font-bold text-on-surface tabular-nums">{progress.xp.toLocaleString()}</span>
            <span className="text-label-xs text-on-surface-variant block leading-tight">XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
