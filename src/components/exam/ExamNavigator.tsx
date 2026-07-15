'use client';

import type { Question } from '@/lib/dataLoader';

interface ExamNavigatorProps {
  filteredQuestions: Question[];
  userAnswers: Record<string, string>;
  currentIndex: number;
  isReviewMode: boolean;
  onNavigate: (index: number) => void;
  onFinish: () => void;
}

export default function ExamNavigator({
  filteredQuestions,
  userAnswers,
  currentIndex,
  isReviewMode,
  onNavigate,
  onFinish,
}: ExamNavigatorProps) {
  return (
    <aside className="w-[280px] shrink-0 h-full flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden max-lg:hidden">
      <div className="p-4 border-b border-outline-variant bg-surface">
        <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2">Overview</h3>
        <div className="flex items-center gap-2">
          <div className="progress-bar flex-1">
            <div
              className="progress-bar-fill"
              style={{ width: `${(Object.keys(userAnswers).length / filteredQuestions.length) * 100}%` }}
            />
          </div>
          <span className="text-label-xs font-bold text-on-surface-variant w-10 text-right tabular-nums">
            {Object.keys(userAnswers).length}/{filteredQuestions.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
          <div className="flex items-center gap-1.5 text-label-xs text-on-surface-variant">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" /> Answered
          </div>
          <div className="flex items-center gap-1.5 text-label-xs text-on-surface-variant">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim" /> Skipped
          </div>
          <div className="flex items-center gap-1.5 text-label-xs text-on-surface-variant">
            <div className="w-2.5 h-2.5 rounded-full bg-surface-container border border-outline-variant" /> Unseen
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {filteredQuestions.map((q, idx) => {
            const isCurrent = currentIndex === idx;
            const isAnswered = !!userAnswers[q.id];
            const isCorrectFlag = isReviewMode ? userAnswers[q.id] === q.answer : false;
            const isWrong = isReviewMode ? userAnswers[q.id] !== q.answer && !!userAnswers[q.id] : false;

            let btnClass = "aspect-square rounded-lg flex items-center justify-center text-label-xs font-medium transition-all border ";

            if (isCurrent) {
              btnClass += "bg-primary text-on-primary shadow-md ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest scale-105 z-10 border-primary";
            } else if (isReviewMode) {
              if (isCorrectFlag) btnClass += "bg-secondary-fixed-dim text-on-secondary-fixed border-secondary/30";
              else if (isWrong) btnClass += "bg-error-container text-on-error-container border-error/30";
              else btnClass += "bg-surface-container border-outline-variant text-on-surface-variant";
            } else {
              if (isAnswered) btnClass += "bg-secondary-fixed-dim text-on-secondary-fixed border-secondary/30 hover:brightness-95";
              else btnClass += "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high";
            }

            return (
              <button
                key={q.id}
                onClick={() => onNavigate(idx)}
                className={btnClass}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-outline-variant bg-surface-container-low text-center">
        <span className="text-label-xs text-on-surface-variant block mb-2">Need a break?</span>
        <button
          onClick={onFinish}
          disabled={Object.keys(userAnswers).length === 0}
          className="w-full py-2 rounded-lg border border-outline text-label-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
        >
          Submit & Finish
        </button>
      </div>
    </aside>
  );
}
