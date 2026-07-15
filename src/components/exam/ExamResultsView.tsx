'use client';

import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import type { Question } from '@/lib/dataLoader';

interface ExamResultsViewProps {
  quizScore: { correct: number; total: number };
  filteredQuestions: Question[];
  userAnswers: Record<string, string>;
  timeLeft: number | null;
  selectedCategory: string | null;
  department: string | null;
  topicMeta: Record<string, { icon: string; gradient: string; border: string }>;
  formatTime: (seconds: number) => string;
  getHumorMessage: (percentage: number) => string;
  onReview: () => void;
  onRestart: () => void;
}

export default function ExamResultsView({
  quizScore,
  filteredQuestions,
  userAnswers,
  timeLeft,
  selectedCategory,
  department,
  topicMeta,
  formatTime,
  getHumorMessage,
  onReview,
  onRestart,
}: ExamResultsViewProps) {
  const router = useRouter();

  return (
    <div className="card p-8 sm:p-12 text-center space-y-8 animate-in zoom-in-95 max-w-3xl mx-auto">
      <div className="space-y-2">
        <div className="text-5xl mb-4">
          {Math.round((quizScore.correct / quizScore.total) * 100) >= 80 ? '\uD83C\uDF96\uFE0F' : Math.round((quizScore.correct / quizScore.total) * 100) >= 50 ? '\uD83D\uDCC4' : '\uD83D\uDC80'}
        </div>
        <h2 className="text-headline-2xl font-bold text-on-surface tracking-tight">
          Exam <span className="text-gradient">Results</span>
        </h2>
        <p className="text-body-base text-on-surface-variant">
          You&apos;ve completed the {selectedCategory === 'all' ? 'Full Mock' : selectedCategory} simulation.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
          <div className="text-headline-2xl font-bold text-on-surface">{Math.round((quizScore.correct / quizScore.total) * 100)}%</div>
          <div className="text-label-xs text-on-surface-variant font-medium mt-1">Score</div>
        </div>
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
          <div className="text-headline-2xl font-bold text-primary">{quizScore.correct}/{quizScore.total}</div>
          <div className="text-label-xs text-on-surface-variant font-medium mt-1">Correct</div>
        </div>
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
          <div className={`text-headline-2xl font-bold ${quizScore.correct === quizScore.total ? 'text-secondary' : 'text-accent-orange'}`}>
            +{quizScore.correct * 10 + 50 + (quizScore.correct === quizScore.total ? 100 : 0)}
          </div>
          <div className="text-label-xs text-on-surface-variant font-medium mt-1">XP Earned</div>
        </div>
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
          <div className={`text-sm font-bold ${timeLeft === 0 ? 'text-error' : 'text-secondary'}`}>
            {timeLeft === 0 ? "Time's up!" : formatTime((filteredQuestions.length * 60) - (timeLeft || 0))}
          </div>
          <div className="text-label-xs text-on-surface-variant font-medium mt-1">Time</div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-primary-container/30 border border-primary/20 max-w-xl mx-auto">
        <p className="text-headline-xl-mobile font-bold text-on-surface">
          &quot;{getHumorMessage(Math.round((quizScore.correct / quizScore.total) * 100))}&quot;
        </p>
      </div>

      <div className="max-w-xl mx-auto text-left space-y-5">
        <h3 className="text-label-sm text-on-surface-variant font-bold tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Exam Breakdown
        </h3>
        <div className="space-y-4">
          {Array.from(new Set(filteredQuestions.map(q => q.topic))).map(topic => {
            const topicQs = filteredQuestions.filter(q => q.topic === topic);
            const correctCount = topicQs.filter(q => userAnswers[q.id] === q.answer).length;
            const percent = Math.round((correctCount / topicQs.length) * 100);

            return (
              <div key={topic} className="p-4 rounded-xl bg-surface-container border border-outline-variant group hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-sm">
                      {topicMeta[topic]?.icon || '\uD83D\uDCDD'}
                    </div>
                    <span className="text-label-sm font-bold text-on-surface">{topic}</span>
                  </div>
                  <span className={`text-label-xs font-bold ${percent >= 70 ? 'text-secondary' : percent >= 50 ? 'text-tertiary' : 'text-error'}`}>
                    {percent}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${percent >= 70 ? '!bg-secondary' : percent >= 50 ? '!bg-tertiary' : '!bg-error'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-label-xs text-on-surface-variant mt-1.5 block">{correctCount}/{topicQs.length} correct</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={onReview} className="btn-primary">
          Review Answers
        </button>
        <button onClick={onRestart} className="btn-secondary">
          Restart Exam
        </button>
        <button
          onClick={() => {
            if (department) {
              router.push(`/exam?department=${encodeURIComponent(department)}`);
            } else {
              router.push('/exam');
            }
          }}
          className="btn-ghost"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
