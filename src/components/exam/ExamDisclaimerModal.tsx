'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExamDisclaimerModalProps {
  selectedCategory: string | null;
  onAccept: () => void;
  onGoBack: () => void;
}

export default function ExamDisclaimerModal({
  selectedCategory,
  onAccept,
  onGoBack,
}: ExamDisclaimerModalProps) {
  const is2017 = selectedCategory === 'Exit Exam 2017' || selectedCategory === 'Archived Exams';
  const displayTitle = is2017 ? 'Exit Exam 2017' : selectedCategory;
  const displayDesc = is2017
    ? "Enter the **2017 Vault**! This is based on actual materials, but we're still in 'active review' mode. If you see a typo that looks like ancient Script, don't worry—it's either a deployment error or you're just not smart enough to understand it yet. We're also working on adding those missing diagrams soon. Don't say we didn't warn you!"
    : 'Official certification and exit exam questions provided for academic preparation.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card max-w-xl w-full p-8 sm:p-12 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-3xl mb-6">
          {is2017 ? '\uD83C\uDF93' : '\uD83D\uDCDD'}
        </div>

        <h2 className="text-headline-2xl font-bold text-on-surface tracking-tight mb-4">
          {displayTitle}
        </h2>

        <div className="space-y-4 mb-8 w-full text-left">
          <div className="text-body-base text-on-surface-variant leading-relaxed prose prose-sm max-w-none prose-p:text-on-surface-variant prose-strong:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayDesc}</ReactMarkdown>
          </div>
          {is2017 && (
            <p className="text-label-xs text-primary font-bold tracking-wider text-center">
              Under Active Review
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button onClick={onGoBack} className="btn-secondary flex-1">
            Go Back
          </button>
          <button onClick={onAccept} className="btn-primary flex-1">
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}
