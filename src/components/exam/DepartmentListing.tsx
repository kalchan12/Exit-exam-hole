'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Zap, Flame, FileText, Search } from 'lucide-react';

import { defaultMeta, BACK_LINK_CLASSES } from '@/lib/constants/exam';

interface DepartmentListingProps {
  xp: number;
  streak: number;
  questionsLength: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredDeptEntries: [string, string[]][];
}

export default function DepartmentListing({
  xp,
  streak,
  questionsLength,
  searchQuery,
  onSearchChange,
  filteredDeptEntries,
}: DepartmentListingProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 py-4">
      <Link
        href="/dashboard"
        className={BACK_LINK_CLASSES}
      >
        <ChevronLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex-1">
          <h1 className="text-headline-2xl font-bold text-on-surface">Exit Exam</h1>
          <p className="text-body-base text-on-surface-variant mt-1">
            Select your department to access authentic past-year exit exam questions.
          </p>
        </div>
        <div className="card bg-surface-container/60 backdrop-blur-sm p-4 shrink-0 flex items-center gap-5 min-w-[240px] self-start">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-headline-xl-mobile font-bold text-on-surface tabular-nums">{xp.toLocaleString()}</span>
            </div>
            <div className="text-label-xs text-on-surface-variant font-medium mt-0.5">XP</div>
          </div>
          <div className="w-px h-10 bg-outline-variant/50" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4 text-secondary" />
              <span className="text-headline-xl-mobile font-bold text-on-surface tabular-nums">{streak}</span>
            </div>
            <div className="text-label-xs text-on-surface-variant font-medium mt-0.5">Day Streak</div>
          </div>
          <div className="w-px h-10 bg-outline-variant/50" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4 text-tertiary" />
              <span className="text-headline-xl-mobile font-bold text-on-surface tabular-nums">{questionsLength.toLocaleString()}</span>
            </div>
            <div className="text-label-xs text-on-surface-variant font-medium mt-0.5">Exam Qs</div>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search departments..."
          className="input-field pl-11 border-outline"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredDeptEntries.map(([dept, sources], index) => {
          const count = questionsLength;
          const meta = dept === 'Computer Science'
            ? { icon: '\ud83d\udcbb', gradient: 'from-emerald-500/20 to-teal-500/20' }
            : dept === 'Software Engineering'
              ? { icon: '\ud83d\udee0\ufe0f', gradient: 'from-rose-500/20 to-pink-500/20' }
              : defaultMeta;
          return (
            <button
              key={dept}
              onClick={() => router.push(`/exam?department=${encodeURIComponent(dept)}`)}
              style={{ animationDelay: `${index * 40}ms` }}
              className="card-hover flex flex-col items-start p-6 text-left group animate-in fade-in slide-in-from-bottom-4"
            >
              <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-xl mb-4 group-hover:scale-110 group-hover:bg-primary-container transition-all duration-300">
                {meta.icon}
              </div>

              <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                {dept}
              </h3>

              <p className="text-label-sm text-on-surface-variant flex-1 mb-4">
                {sources.length} exam set{sources.length !== 1 ? 's' : ''} available
              </p>

              <div className="flex items-center gap-2 mt-auto">
                <span className="text-sm font-bold text-primary tabular-nums">{count}</span>
                <span className="text-label-xs text-on-surface-variant">Questions</span>
              </div>
            </button>
          );
        })}
      </div>

      {searchQuery && filteredDeptEntries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 opacity-40">{'\ud83d\udd0d'}</div>
          <p className="text-on-surface-variant text-sm">No departments matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}
