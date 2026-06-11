'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { getNotes, saveCustomNote, type Note } from '@/lib/dataLoader';
import { recordNoteCompleted, getProgress, syncProgressToRemote } from '@/lib/progressManager';
import { useAuth } from '@/components/AuthProvider';
import { fetchGitHubNote } from '@/lib/githubFetcher';

function extractChapterNum(title: string): number {
  const match = title.match(/Chapter\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

export default function NoteViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getNotes().then(async (notes) => {
      const sorted = [...notes].sort((a, b) => {
        const numA = extractChapterNum(a.title);
        const numB = extractChapterNum(b.title);
        return numA - numB;
      });
      setAllNotes(sorted);
      let foundNote = sorted.find((n) => n.id === id) || null;
      
      if (foundNote && !foundNote.body && foundNote.githubUrl) {
         try {
            const fresh = await fetchGitHubNote(foundNote.githubUrl, foundNote.topic);
            foundNote = { ...foundNote, body: fresh.body || '', images: fresh.images };
         } catch (e) {
            console.error('Failed to auto-fetch GitHub note:', e);
         }
      }
      
      setNote(foundNote);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (id) {
      const state = getProgress();
      setIsCompleted(!!state.completedNotes?.[id]);
    }
  }, [id]);

  const courseNotes = useMemo(() => {
    if (!note) return [];
    return allNotes.filter((n) => (n.course || n.topic) === (note.course || note.topic));
  }, [allNotes, note]);

  const currentIndex = courseNotes.findIndex((n) => n.id === id);
  const prevNote = currentIndex > 0 ? courseNotes[currentIndex - 1] : null;
  const nextNote = currentIndex >= 0 && currentIndex < courseNotes.length - 1 ? courseNotes[currentIndex + 1] : null;

  const goNext = () => {
    if (!id || !nextNote) return;
    if (!isCompleted) {
      recordNoteCompleted(id);
      if (user) syncProgressToRemote(user.id);
    }
    router.push(`/notes/view?id=${nextNote.id}`);
  };

  const goPrev = () => {
    if (!prevNote) return;
    router.push(`/notes/view?id=${prevNote.id}`);
  };

  const handleComplete = () => {
    if (!id || isCompleted) return;
    recordNoteCompleted(id);
    setIsCompleted(true);
    if (user) syncProgressToRemote(user.id);
  };

  const handleRefresh = async () => {
    if (!note?.githubUrl || isRefreshing) return;
    setIsRefreshing(true);
    setRefreshMsg('');
    try {
      const fresh = await fetchGitHubNote(note.githubUrl, note.topic, true);
      const updated = { ...note, body: fresh.body || '', images: fresh.images, date: new Date().toISOString() };
      setNote(updated);
      saveCustomNote(updated);
      setRefreshMsg('Synced from GitHub!');
      setTimeout(() => setRefreshMsg(''), 3000);
    } catch (e) {
      setRefreshMsg('Refresh failed');
      setTimeout(() => setRefreshMsg(''), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditSave = () => {
    if (!note || !editVideoUrl.trim()) return;
    const url = editVideoUrl.trim();
    const currentUrls = note.videoUrls || (note.videoUrl ? [note.videoUrl] : []);
    if (currentUrls.includes(url)) return;
    const newUrls = [...currentUrls, url];
    const updated = { ...note, videoUrls: newUrls, videoUrl: newUrls[0] };
    setNote(updated);
    saveCustomNote(updated);
    setEditVideoUrl('');
  };

  const normalizeVideoUrl = (url: string): string => {
    let normalized = url.trim();
    if (!normalized) return '';
    if (normalized.includes('youtube.com/watch?v=')) {
      const videoId = new URL(normalized).searchParams.get('v');
      if (videoId) normalized = `https://www.youtube.com/embed/${videoId}`;
    } else if (normalized.includes('youtu.be/')) {
      const parts = normalized.split('/');
      const videoId = parts[parts.length - 1].split('?')[0];
      if (videoId) normalized = `https://www.youtube.com/embed/${videoId}`;
    }
    return normalized;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-dark-700 w-24 rounded-lg" />
        <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded-xl w-2/3" />
        <div className="h-64 bg-gray-200 dark:bg-dark-700 rounded-xl w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Note not found</h2>
        <button onClick={() => router.push('/notes')} className="btn-primary">Return to Notes</button>
      </div>
    );
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown Date';
    return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const bodyContent = note.body || '*This note has no content.*';

  return (
    <div className="max-w-5xl mx-auto pb-16 px-4 sm:px-6">
      <div className="bg-gray-50 dark:bg-[#11152a]/60 backdrop-blur-2xl border border-gray-200 dark:border-white/5 rounded-3xl mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative group/content mt-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-purple/20 to-transparent opacity-0 group-hover/content:opacity-100 transition-opacity duration-700 z-10" />

        {/* Sticky header */}
        <div className="sticky top-0 z-50 bg-gray-100/80 dark:bg-[#080d21]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.05] p-4 sm:px-12 rounded-t-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/notes" className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-500 hover:text-accent-purple-light transition-all group/back">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-400/20 flex items-center justify-center group-hover/back:border-accent-purple/40">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <span className="hidden sm:inline">Library</span>
              </Link>
              {note?.githubUrl && (
                <button onClick={handleRefresh} disabled={isRefreshing}
                  className="ml-2 inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-accent-purple-light bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-400/20 rounded-lg px-2.5 py-1.5 transition-all hover:border-accent-purple/40">
                  <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isRefreshing ? 'Syncing...' : 'Sync'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {refreshMsg && (
                <span className="text-[10px] font-bold text-emerald-400 animate-in fade-in">{refreshMsg}</span>
              )}
              <button onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-accent-purple-light bg-gray-100 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-400/20 rounded-lg px-2.5 py-1.5 transition-all hover:border-accent-purple/40">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">{note.course || note.topic}</span>
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        {isEditing && (
          <div className="p-6 sm:px-12 border-b border-gray-200 dark:border-white/[0.05] bg-gray-50/50 dark:bg-[#0a0f1e]/50 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Add Video URL</h4>
            <div className="flex gap-2">
              <input type="text" value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditSave(); } }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-purple-500 focus:outline-none"
              />
              <button onClick={handleEditSave}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all">
                Add Video
              </button>
            </div>
            {(note?.videoUrls?.length || (note?.videoUrl ? 1 : 0) || 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(note?.videoUrls && note.videoUrls.length > 0 ? note.videoUrls : note?.videoUrl ? [note.videoUrl] : []).map((v, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                    Video {i + 1}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hero Header */}
        <div className="p-8 sm:p-12 pb-0">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-[10px] text-accent-purple-light font-black uppercase tracking-[0.25em] bg-accent-purple/10 px-3 py-1.5 rounded-lg border border-accent-purple/20 shadow-glow-xs-purple">
              {note.course || note.topic}
            </span>
            <div className="h-1 w-1 rounded-full bg-gray-700" />
            <span className="text-xs text-gray-500 font-bold">{formatDate(note.date)}</span>
            {note.label && (
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 font-bold uppercase tracking-wider">
                {note.label}
              </span>
            )}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-8">
            {note.title}
          </h1>
          {note.summary && (
            <div className="relative pl-6 py-1 mb-12">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-accent-purple to-fuchsia-600 rounded-full shadow-glow-sm-purple" />
              <p className="text-gray-600 dark:text-gray-400 text-xl font-medium leading-relaxed max-w-4xl">
                {note.summary}
              </p>
            </div>
          )}
          <div className="h-px w-full bg-gradient-to-r from-white/[0.07] via-white/[0.03] to-transparent" />
        </div>

        {/* Full content */}
        <div className="p-8 sm:p-12">
          <div className="prose prose-invert prose-purple max-w-none text-gray-700 dark:text-gray-300 overflow-x-auto leading-[1.85] text-[15px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {bodyContent}
            </ReactMarkdown>
          </div>

          {note.images && note.images.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-200 dark:border-dark-400/15 pt-8">
              {note.images.map((img, i) => (
                <img key={i} src={img} alt={`Attachment ${i+1}`} className="rounded-xl border border-gray-200 dark:border-dark-400/20 max-h-96 object-contain shadow-lg" />
              ))}
            </div>
          )}

          {note.links && note.links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-200 dark:border-dark-400/15 pt-8">
              <h4 className="w-full text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-2">Attached Links</h4>
              {note.links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-accent-purple-light hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-dark-700/50 hover:bg-gray-200 dark:hover:bg-dark-600/50 border border-gray-200 dark:border-dark-400/30 rounded-lg px-4 py-2 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Link {note.links!.length > 1 ? i + 1 : ''}
                </a>
              ))}
            </div>
          )}

          {(note.videoUrl || (note.videoUrls && note.videoUrls.length > 0)) && (
            <div className="mt-10 border-t border-gray-200 dark:border-white/5 pt-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Video{(note.videoUrls?.length || note.videoUrl ? 1 : 0) > 1 ? 's' : ''} Lesson
              </h4>
              <div className="space-y-4">
                {(note.videoUrls && note.videoUrls.length > 0 ? note.videoUrls : note.videoUrl ? [note.videoUrl] : []).map((vurl, idx) => (
                  <div key={idx} className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 bg-black">
                    <iframe
                      src={vurl.includes('youtube') || vurl.includes('youtu.be')
                        ? vurl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                        : vurl
                      }
                      className="w-full h-full"
                      allowFullScreen
                      title={`Video Lesson ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Action */}
          <div className="mt-12 flex flex-col items-center justify-center p-8 rounded-2xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent pointer-events-none" />
            {isCompleted ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-glow-sm-green">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Note Mastered!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">Excellent work. This note is now part of your knowledge base.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center relative z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Finished Reading?</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">Mark this as completed to update your progress and move towards your goal.</p>
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
        </div>
      </div>

      {/* Chapter Navigation */}
      <div className="flex items-center gap-4">
        {prevNote ? (
          <button
            onClick={goPrev}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 active:scale-95 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous Chapter
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {nextNote ? (
          <button
            onClick={goNext}
            className="flex-[1.5] flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black bg-gradient-to-r from-accent-purple to-fuchsia-600 text-white hover:shadow-xl hover:shadow-purple-500/20 active:scale-95 transition-all duration-300"
          >
            Next Chapter
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <Link
            href="/notes"
            className="flex-[1.5] flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 active:scale-95 transition-all duration-300"
          >
            Back to Library
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
