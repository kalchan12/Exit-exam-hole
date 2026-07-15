'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, X as XIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question } from '@/lib/dataLoader';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
};

interface ExamQuestionPanelProps {
  question: Question;
  index: number;
  total: number;
  userAnswers: Record<string, string>;
  isReviewMode: boolean;
  onSelectAnswer: (answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function ExamQuestionPanel({
  question,
  index,
  total,
  userAnswers,
  isReviewMode,
  onSelectAnswer,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: ExamQuestionPanelProps) {
  return (
    <main className="flex-1 overflow-y-auto pr-2 pb-12 custom-scrollbar">
      <div className="max-w-[800px] mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-xs font-bold shadow-sm">
              Q.{String(index + 1).padStart(2, '0')}
            </div>
            <span className={DIFFICULTY_COLORS[question.difficulty] || 'badge-medium'}>
              {question.difficulty}
            </span>
            {isReviewMode && userAnswers[question.id] === question.answer && (
              <span className="badge-easy">Correct</span>
            )}
            {isReviewMode && userAnswers[question.id] && userAnswers[question.id] !== question.answer && (
              <span className="badge-hard">Incorrect</span>
            )}
          </div>
          <div className="text-label-sm text-on-surface-variant">+2 Points</div>
        </div>

        <div className="text-body-lg text-on-surface leading-relaxed prose prose-lg max-w-none prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-primary prose-code:text-secondary prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({...props}) => (
                <img
                  {...props}
                  className="max-w-full sm:max-w-md h-auto rounded-xl mx-auto my-6 border border-outline-variant shadow-sm"
                />
              ),
              p: ({children}) => <p className="font-medium leading-relaxed">{children}</p>
            }}
          >
            {question.question}
          </ReactMarkdown>
        </div>

        {question.options[0] && (
          <div className="flex flex-col gap-4">
            {question.options.map((option, idx) => {
              const isSelected = userAnswers[question.id] === option;
              const isCorrect = option === question.answer;

              let containerClass = "group relative flex items-center p-4 rounded-xl border cursor-pointer transition-all overflow-hidden ";
              let circleClass = "w-7 h-7 rounded-full border-2 flex items-center justify-center text-label-sm font-bold shrink-0 transition-colors ";

              if (isReviewMode) {
                containerClass += isCorrect
                  ? "border-secondary bg-secondary-fixed-dim/10"
                  : isSelected
                    ? "border-error bg-error-container/20"
                    : "border-outline-variant bg-surface-container-lowest opacity-60";
                circleClass += isCorrect
                  ? "border-secondary bg-secondary text-on-secondary"
                  : isSelected
                    ? "border-error bg-error text-on-error"
                    : "border-outline text-on-surface-variant";
              } else {
                containerClass += isSelected
                  ? "border-primary bg-primary-container/10 shadow-sm"
                  : "border-outline-variant bg-surface-container-lowest hover:border-primary-fixed-dim hover:shadow-sm";
                circleClass += isSelected
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline text-on-surface-variant group-hover:border-primary-fixed-dim";
              }

              return (
                <button
                  key={idx}
                  onClick={() => onSelectAnswer(option)}
                  disabled={isReviewMode}
                  className={containerClass}
                >
                  <div className="absolute inset-0 bg-primary-container opacity-0 peer-checked:opacity-10 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10 w-full">
                    <div className={circleClass}>
                      {isReviewMode && isCorrect ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : isReviewMode && isSelected && !isCorrect ? (
                        <XIcon className="w-3.5 h-3.5" />
                      ) : (
                        String.fromCharCode(65 + idx)
                      )}
                    </div>
                    <span className={`text-body-base ${isSelected ? 'font-medium' : ''} text-on-surface text-left`}>
                      {option.replace(/^[A-Z]\)\s?/, '')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {isReviewMode && question.explanation && (
          <div className="p-5 rounded-xl bg-primary-container/20 border border-primary/20 animate-in slide-in-from-bottom-2">
            <span className="text-label-xs font-bold text-primary tracking-wider block mb-2">Detailed Analysis</span>
            <div className="text-body-base text-on-surface-variant leading-relaxed prose prose-sm max-w-none prose-p:text-on-surface-variant prose-strong:text-primary prose-code:text-secondary prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {question.explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-outline-variant">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors text-label-sm font-medium disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:brightness-110 transition-all text-label-sm font-bold shadow-sm disabled:opacity-50"
          >
            Next Question
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
