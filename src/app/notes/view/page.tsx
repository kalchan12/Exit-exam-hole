'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { getNotes, type Note } from '@/lib/dataLoader';
import { recordNoteCompleted, getProgress, syncProgressToRemote } from '@/lib/progressManager';
import { useAuth } from '@/components/AuthProvider';
import { fetchGitHubNote } from '@/lib/githubFetcher';

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
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getNotes().then(async (notes) => {
      const sorted = [...notes].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      setAllNotes(sorted);
      let foundNote = sorted.find((n) => n.id === id) || null;
      
      if (foundNote && !foundNote.body && foundNote.githubUrl) {
         try {
            const fresh = await fetchGitHubNote(foundNote.githubUrl, foundNote.topic);
            foundNote = { ...foundNote, body: fresh.body, images: fresh.images };
         } catch (e) {
            console.error('Failed to auto-fetch GitHub note:', e);
         }
      }
      
      setNote(foundNote);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { setCurrentPage(0); }, [id]);

  useEffect(() => {
    if (id) {
      const state = getProgress();
      setIsCompleted(!!state.completedNotes?.[id]);
    }
  }, [id]);

  const handleComplete = useCallback(() => {
    if (!id || isCompleted) return;
    recordNoteCompleted(id);
    setIsCompleted(true);
    if (user) syncProgressToRemote(user.id);
  }, [id, isCompleted, user]);

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
    <div className="max-w-5xl mx-auto pb-16 px-4 sm:px-6">



      {/* ─── NOTE HEADER (first page only) ─── */}


      {/* ─── MAIN CONTENT CARD ─── */}
      <div className="bg-[#11152a]/60 backdrop-blur-2xl border border-white/5 rounded-3xl mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative group/content mt-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-purple/20 to-transparent opacity-0 group-hover/content:opacity-100 transition-opacity duration-700 z-10" />

        {/* ─── INTEGRATED STICKY NAVIGATION ─── */}
        <div className="sticky top-0 z-50 bg-[#080d21]/80 backdrop-blur-xl border-b border-white/[0.05] p-4 sm:px-12 flex flex-col gap-3 rounded-t-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <Link href="/notes" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-accent-purple-light transition-all group/back">
              <div className="w-7 h-7 rounded-lg bg-dark-800/50 border border-dark-400/20 flex items-center justify-center group-hover/back:border-accent-purple/40">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="hidden sm:inline">Library</span>
            </Link>

            <div className="flex items-center gap-3">
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-[10px] font-black text-gray-500 tabular-nums font-mono">{currentPage + 1}</span>
                  <div className="h-2 w-px bg-white/10" />
                  <span className="text-[10px] font-black text-gray-600 tabular-nums font-mono">{totalPages}</span>
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 transition-all duration-500 ${
                progressPercent === 100
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-white/5 text-accent-purple-light'
              }`}>
                <span className="text-[9px] font-black tracking-[0.1em] uppercase opacity-60">{progressPercent === 100 ? 'Mastered' : 'Progress'}</span>
                <span className="text-[11px] font-black tabular-nums">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Seamless Progress bar */}
          <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                progressPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-glow-xs-green'
                  : 'bg-gradient-to-r from-accent-purple to-fuchsia-500 shadow-glow-xs-purple'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Hero Header Section */}
        {isFirstPage && (
          <div className="p-8 sm:p-12 pb-0 sm:pb-0">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-[10px] text-accent-purple-light font-black uppercase tracking-[0.25em] bg-accent-purple/10 px-3 py-1.5 rounded-lg border border-accent-purple/20 shadow-glow-xs-purple">
                {note.course || note.topic}
              </span>
              <div className="h-1 w-1 rounded-full bg-gray-700" />
              <span className="text-xs text-gray-500 font-bold">{formatDate(note.date)}</span>
              {note.label && (
                <span className="text-[10px] px-2.5 py-1 rounded-md bg-white/[0.03] text-gray-400 border border-white/10 font-bold uppercase tracking-wider">
                  {note.label}
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight mb-8">
              {note.title}
            </h1>
            {note.summary && (
              <div className="relative pl-6 py-1 mb-12">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-accent-purple to-fuchsia-600 rounded-full shadow-glow-sm-purple" />
                <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-4xl">
                  {note.summary}
                </p>
              </div>
            )}
            <div className="h-px w-full bg-gradient-to-r from-white/[0.07] via-white/[0.03] to-transparent" />
          </div>
        )}

        {/* Page Inner Content */}
        <div className="p-8 sm:p-12">
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

        {/* Completion Action */}
        {isLastPage && (
          <div className="mt-12 flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.03] border border-white/5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent pointer-events-none" />
            {isCompleted ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-glow-sm-green">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white mb-2">Note Mastered!</h3>
                <p className="text-gray-400 text-sm max-w-xs">Excellent work. This note is now part of your knowledge base.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center relative z-10">
                <h3 className="text-lg font-bold text-white mb-2">Finished Reading?</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-sm">Mark this as completed to update your progress and move towards your goal.</p>
                <button
                  onClick={handleComplete}
                  className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Completed
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* ─── NAVIGATION (at the end of content, NOT fixed) ─── */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goPrev}
            disabled={isFirstPage}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all duration-300 border ${
              isFirstPage
                ? 'bg-transparent border-white/5 text-gray-700 cursor-not-allowed'
                : 'bg-white/5 text-gray-300 hover:text-white border-white/10 hover:border-white/20 active:scale-95'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous Section
          </button>

          {isLastPage ? (
            nextNote ? (
              <Link
                href={`/notes/view?id=${nextNote.id}`}
                className="flex-[1.5] flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black bg-gradient-to-r from-accent-purple to-fuchsia-600 text-white hover:shadow-xl hover:shadow-purple-500/20 active:scale-95 transition-all duration-300"
              >
                Next Note
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/notes"
                className="flex-[1.5] flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95 transition-all duration-300"
              >
                Return to Library
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
            )
          ) : (
            <button
              onClick={goNext}
              className="flex-[1.5] flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black bg-accent-purple text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all duration-300 hover:brightness-110"
            >
              Next Section
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="flex items-center justify-center gap-4 opacity-40">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest whitespace-nowrap">
            Use <kbd className="px-1.5 py-0.5 rounded bg-dark-700 border border-dark-400/30 font-mono text-white mx-1">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-dark-700 border border-dark-400/30 font-mono text-white mx-1">→</kbd> to navigate
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Note-to-note navigation (shown on last page) */}
        {isLastPage && (prevNote || nextNote) && (
          <div className="grid grid-cols-2 gap-4 pt-6 mt-4">
            {prevNote ? (
              <Link href={`/notes/view?id=${prevNote.id}`} className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-purple/30 transition-all">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 group-hover:text-accent-purple-light transition-colors">Previous Note</div>
                <div className="text-sm text-gray-400 font-semibold truncate group-hover:text-white transition-colors">{prevNote.title}</div>
              </Link>
            ) : <div />}
            {nextNote ? (
              <Link href={`/notes/view?id=${nextNote.id}`} className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-purple/30 transition-all text-right">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 group-hover:text-accent-purple-light transition-colors">Next Up</div>
                <div className="text-sm text-gray-400 font-semibold truncate group-hover:text-white transition-colors">{nextNote.title}</div>
              </Link>
            ) : <div />}
          </div>
        )}
      </div>
    </div>
  );
}
