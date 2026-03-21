'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { getNotes, type Note } from '@/lib/dataLoader';

function splitContentIntoPages(body: string, keyPoints?: string[]): string[] {
  if (!body && keyPoints && keyPoints.length > 0) {
    const pages: string[] = [];
    for (let i = 0; i < keyPoints.length; i += 3) {
      const chunk = keyPoints.slice(i, i + 3);
      pages.push(chunk.map((p, idx) => `### Point ${i + idx + 1}\n\n${p}`).join('\n\n'));
    }
    return pages;
  }
  if (!body) return ['*This note has no content.*'];

  const MIN_PAGE_LENGTH = 1500;
  const rawSections: string[] = [];
  const lines = body.split('\n');
  let currentSection = '';
  for (const line of lines) {
    if (/^#{1,3}\s/.test(line) && currentSection.trim().length > 0) {
      rawSections.push(currentSection.trim());
      currentSection = line + '\n';
    } else {
      currentSection += line + '\n';
    }
  }
  if (currentSection.trim().length > 0) rawSections.push(currentSection.trim());

  const mergedPages: string[] = [];
  let currentPage = '';
  for (const section of rawSections) {
    if (currentPage.length > 0 && currentPage.length >= MIN_PAGE_LENGTH) {
      mergedPages.push(currentPage.trim());
      currentPage = section + '\n\n';
    } else {
      currentPage += (currentPage.length > 0 ? '\n\n' : '') + section;
    }
  }
  if (currentPage.trim().length > 0) mergedPages.push(currentPage.trim());

  if (mergedPages.length <= 1 && body.length > MIN_PAGE_LENGTH * 2) {
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 0);
    const pages: string[] = [];
    let page = '';
    for (const para of paragraphs) {
      if (page.length >= MIN_PAGE_LENGTH) {
        pages.push(page.trim());
        page = para + '\n\n';
      } else {
        page += para + '\n\n';
      }
    }
    if (page.trim().length > 0) pages.push(page.trim());
    if (pages.length > 1) return pages;
  }

  return mergedPages.length > 0 ? mergedPages : [body];
}

export default function NoteViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getNotes().then((notes) => {
      const sorted = [...notes].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      setAllNotes(sorted);
      setNote(sorted.find((n) => n.id === id) || null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { setCurrentPage(0); }, [id]);

  const pages = useMemo(() => {
    if (!note) return [];
    return splitContentIntoPages(note.body || '', note.key_points);
  }, [note]);

  const totalPages = pages.length;
  const progressPercent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
        <div className="h-8 bg-dark-700 w-24 rounded-lg" />
        <div className="h-12 bg-dark-700 rounded-xl w-2/3" />
        <div className="h-64 bg-dark-700 rounded-xl w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Note not found</h2>
        <button onClick={() => router.push('/notes')} className="btn-primary">Return to Notes</button>
      </div>
    );
  }

  const currentIndex = allNotes.findIndex((n) => n.id === id);
  const prevNote = currentIndex > 0 ? allNotes[currentIndex - 1] : null;
  const nextNote = currentIndex < allNotes.length - 1 ? allNotes[currentIndex + 1] : null;
  const isLastPage = currentPage === totalPages - 1;
  const isFirstPage = currentPage === 0;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown Date';
    return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">

      {/* ─── FIXED PROGRESS HEADER ─── */}
      <div className="sticky top-0 z-20 bg-dark-900/90 backdrop-blur-md pb-3 pt-2 -mx-2 px-2">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/notes" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Notes
          </Link>

          <div className="flex items-center gap-2.5">
            {totalPages > 1 && (
              <span className="text-[11px] text-gray-500 tabular-nums font-mono">
                {currentPage + 1}<span className="text-gray-600">/</span>{totalPages}
              </span>
            )}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
              progressPercent === 100
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-accent-purple/15 text-accent-purple-light'
            }`}>
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-dark-700/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              progressPercent === 100
                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                : 'bg-gradient-to-r from-accent-purple to-fuchsia-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Page dots */}
        {totalPages > 1 && totalPages <= 20 && (
          <div className="flex items-center justify-center gap-1 mt-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                aria-label={`Page ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === currentPage
                    ? 'w-5 h-1.5 bg-accent-purple'
                    : i < currentPage
                    ? 'w-1.5 h-1.5 bg-emerald-500/50 hover:bg-emerald-400'
                    : 'w-1.5 h-1.5 bg-dark-500/60 hover:bg-dark-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── NOTE HEADER (first page only) ─── */}
      {isFirstPage && (
        <div className="mt-6 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs text-accent-purple-light font-semibold uppercase tracking-widest">
              {note.course || note.topic}
            </span>
            <span className="text-[10px] text-gray-600">•</span>
            <span className="text-xs text-gray-500">{formatDate(note.date)}</span>
            {note.source && note.source !== 'system' && (
              <>
                <span className="text-[10px] text-gray-600">•</span>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                  note.source === 'GitHub' ? 'bg-blue-500/15 text-blue-400'
                  : note.source === 'Local' ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-purple-500/15 text-purple-400'
                }`}>{note.source}</span>
              </>
            )}
            {note.label && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-600 text-gray-400 border border-dark-400/30">
                {note.label}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-[1.15] tracking-tight">
            {note.title}
          </h1>
          {note.summary && (
            <p className="text-gray-400 text-base leading-relaxed mt-4 max-w-2xl">
              {note.summary}
            </p>
          )}
        </div>
      )}

      {/* ─── PAGE CONTENT ─── */}
      <div className="bg-dark-800/60 border border-dark-400/20 rounded-2xl p-6 sm:p-10 mb-8 shadow-xl shadow-black/20">
        {/* Breadcrumb on non-first pages */}
        {totalPages > 1 && !isFirstPage && (
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-dark-400/15">
            <span className="w-6 h-6 rounded-md bg-accent-purple/15 text-accent-purple-light flex items-center justify-center font-bold text-[10px]">
              {currentPage + 1}
            </span>
            <span className="text-sm font-medium text-gray-400 truncate">{note.title}</span>
          </div>
        )}

        <div className="prose prose-invert prose-purple max-w-none text-gray-300 overflow-x-auto leading-[1.85] text-[15px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {pages[currentPage] || ''}
          </ReactMarkdown>
        </div>

        {/* Media on last page */}
        {isLastPage && note.images && note.images.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4 border-t border-dark-400/15 pt-8">
            {note.images.map((img, i) => (
              <img key={i} src={img} alt={`Attachment ${i+1}`} className="rounded-xl border border-dark-400/20 max-h-96 object-contain shadow-lg" />
            ))}
          </div>
        )}

        {/* Links on last page */}
        {isLastPage && note.links && note.links.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 border-t border-dark-400/15 pt-8">
            <h4 className="w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attached Links</h4>
            {note.links.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent-purple-light hover:text-white bg-dark-700/50 hover:bg-dark-600/50 border border-dark-400/30 rounded-lg px-4 py-2 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Link {note.links!.length > 1 ? i + 1 : ''}
              </a>
            ))}
          </div>
        )}

        {/* Completion */}
        {isLastPage && progressPercent === 100 && totalPages > 1 && (
          <div className="mt-10 p-5 rounded-xl bg-gradient-to-br from-emerald-500/8 to-green-500/8 border border-emerald-500/20 text-center">
            <p className="text-emerald-400 font-semibold text-base">🎉 You've completed this note!</p>
            <p className="text-gray-500 text-xs mt-1">{totalPages} sections read</p>
          </div>
        )}
      </div>

      {/* ─── NAVIGATION (at the end of content, NOT fixed) ─── */}
      <div className="space-y-4">
        {/* Section nav buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            disabled={isFirstPage}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isFirstPage
                ? 'bg-dark-800/30 text-gray-700 cursor-not-allowed'
                : 'bg-dark-800 text-gray-300 hover:text-white border border-dark-400/30 hover:border-gray-500/50 active:scale-[0.98]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {isLastPage ? (
            nextNote ? (
              <Link
                href={`/notes/view?id=${nextNote.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-accent-purple to-fuchsia-500 text-white hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition-all duration-200"
              >
                Next Note
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/notes"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 active:scale-[0.98] transition-all duration-200"
              >
                Done
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </Link>
            )
          ) : (
            <button
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-accent-purple hover:bg-accent-purple-light text-white active:scale-[0.98] transition-all duration-200 shadow-lg shadow-purple-500/15"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-[10px] text-gray-600">
          Use <kbd className="px-1 py-px rounded bg-dark-700 border border-dark-500/50 font-mono text-gray-500 mx-0.5">←</kbd> <kbd className="px-1 py-px rounded bg-dark-700 border border-dark-500/50 font-mono text-gray-500 mx-0.5">→</kbd> arrow keys to navigate
        </p>

        {/* Note-to-note navigation (shown on last page) */}
        {isLastPage && (prevNote || nextNote) && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dark-400/15 mt-2">
            {prevNote ? (
              <Link href={`/notes/view?id=${prevNote.id}`} className="group p-4 rounded-xl bg-dark-800/40 border border-dark-400/15 hover:border-dark-400/40 transition-all">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">← Previous Note</div>
                <div className="text-sm text-gray-400 font-medium truncate group-hover:text-white transition-colors">{prevNote.title}</div>
              </Link>
            ) : <div />}
            {nextNote ? (
              <Link href={`/notes/view?id=${nextNote.id}`} className="group p-4 rounded-xl bg-dark-800/40 border border-dark-400/15 hover:border-dark-400/40 transition-all text-right">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Next Note →</div>
                <div className="text-sm text-gray-400 font-medium truncate group-hover:text-white transition-colors">{nextNote.title}</div>
              </Link>
            ) : <div />}
          </div>
        )}
      </div>
    </div>
  );
}
