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
import { ChevronLeft, ChevronRight, RefreshCw, Edit, CheckCircle, Video, ExternalLink } from 'lucide-react';

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
         } catch {
            console.error('Failed to auto-fetch GitHub note:');
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
    } catch {
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
      <div className="animate-pulse space-y-6 max-w-4xl mx-auto py-4">
        <div className="h-8 bg-surface-container-highest w-24 rounded-lg" />
        <div className="h-10 bg-surface-container-highest rounded-xl w-2/3" />
        <div className="h-64 bg-surface-container-highest rounded-xl w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-headline-2xl font-bold text-on-surface mb-4">Note not found</h2>
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
    <div className="max-w-5xl mx-auto pb-16">
      <div className="card mt-4 relative overflow-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant p-4 sm:px-8 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/notes" className="inline-flex items-center gap-2 text-label-xs font-bold text-on-surface-variant hover:text-primary transition-all">
                <div className="w-7 h-7 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline">Library</span>
              </Link>
              {note?.githubUrl && (
                <button onClick={handleRefresh} disabled={isRefreshing}
                  className="ml-2 inline-flex items-center gap-1.5 text-label-xs font-bold text-on-surface-variant hover:text-primary bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 transition-all">
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Syncing...' : 'Sync'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {refreshMsg && (
                <span className="text-label-xs font-bold text-secondary animate-in fade-in">{refreshMsg}</span>
              )}
              <button onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 text-label-xs font-bold text-on-surface-variant hover:text-primary bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 transition-all">
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <span className="text-label-xs text-on-surface-variant truncate">{note.course || note.topic}</span>
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        {isEditing && (
          <div className="p-6 sm:px-8 border-b border-outline-variant bg-surface-container animate-in fade-in slide-in-from-top-2">
            <h4 className="text-label-xs font-bold tracking-wider text-on-surface-variant mb-3">Add Video URL</h4>
            <div className="flex gap-2">
              <input type="text" value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditSave(); } }}
                placeholder="https://www.youtube.com/watch?v=..."
                aria-label="Add Video URL"
                className="input-field"
              />
              <button onClick={handleEditSave}
                className="btn-primary text-label-xs">
                Add Video
              </button>
            </div>
            {(note?.videoUrls?.length || (note?.videoUrl ? 1 : 0) || 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(note?.videoUrls && note.videoUrls.length > 0 ? note.videoUrls : note?.videoUrl ? [note.videoUrl] : []).map((v, i) => (
                  <span key={i} className="text-label-xs px-2 py-1 rounded-md bg-surface-container border border-outline-variant text-on-surface-variant truncate max-w-[200px]">
                    Video {i + 1}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hero Header */}
        <div className="p-8 sm:p-10 pb-0">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="badge-source text-label-xs font-bold">
              {note.course || note.topic}
            </span>
            <div className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="text-label-xs text-on-surface-variant font-medium">{formatDate(note.date)}</span>
            {note.label && (
              <span className="badge bg-surface-container border border-outline-variant text-on-surface-variant text-label-xs font-bold">
                {note.label}
              </span>
            )}
          </div>
          <h1 className="text-headline-3xl sm:text-hero-sm font-bold text-on-surface leading-tight tracking-tight mb-6">
            {note.title}
          </h1>
          {note.summary && (
            <div className="relative pl-5 py-1 mb-8">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
              <p className="text-body-base text-on-surface-variant font-medium leading-relaxed max-w-4xl">
                {note.summary}
              </p>
            </div>
          )}
          <div className="h-px w-full bg-gradient-to-r from-outline-variant via-outline-variant/30 to-transparent" />
        </div>

        {/* Full content */}
        <div className="p-8 sm:p-10">
          <div className="prose max-w-none text-on-surface leading-relaxed text-body-base prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-primary prose-code:text-secondary prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {bodyContent}
            </ReactMarkdown>
          </div>

          {note.images && note.images.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-4 border-t border-outline-variant pt-6">
              {note.images.map((img, i) => (
                <img key={i} src={img} alt={`Attachment ${i+1}`} className="rounded-xl border border-outline-variant max-h-96 object-contain shadow-sm" />
              ))}
            </div>
          )}

          {note.links && note.links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-outline-variant pt-6">
              <h4 className="w-full text-label-xs font-semibold text-on-surface-variant tracking-wider mb-2">Attached Links</h4>
              {note.links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-label-sm text-primary hover:text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Link {note.links!.length > 1 ? i + 1 : ''}
                </a>
              ))}
            </div>
          )}

          {(note.videoUrl || (note.videoUrls && note.videoUrls.length > 0)) && (
            <div className="mt-8 border-t border-outline-variant pt-6">
              <h4 className="text-label-xs font-bold tracking-wider text-on-surface-variant mb-4 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-secondary" />
                Video{(note.videoUrls?.length || note.videoUrl ? 1 : 0) > 1 ? 's' : ''} Lesson
              </h4>
              <div className="space-y-4">
                {(note.videoUrls && note.videoUrls.length > 0 ? note.videoUrls : note.videoUrl ? [note.videoUrl] : []).map((vurl, idx) => (
                  <div key={idx} className="aspect-video rounded-xl overflow-hidden shadow-sm border border-outline-variant bg-black">
                    <iframe
                      src={normalizeVideoUrl(vurl)}
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
          <div className="mt-10 flex flex-col items-center justify-center p-8 rounded-xl bg-surface-container border border-outline-variant text-center relative overflow-hidden">
            {isCompleted ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="w-14 h-14 rounded-xl bg-secondary-fixed-dim/30 flex items-center justify-center mb-4 border border-secondary/30">
                  <CheckCircle className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2">Note Mastered!</h3>
                <p className="text-body-base text-on-surface-variant max-w-xs">Excellent work. This note is now part of your knowledge base.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2">Finished Reading?</h3>
                <p className="text-body-base text-on-surface-variant mb-6 max-w-sm">Mark this as completed to update your progress and move towards your goal.</p>
                <button
                  onClick={handleComplete}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Navigation */}
      <div className="flex items-center gap-4 mt-6">
        {prevNote ? (
          <button
            onClick={goPrev}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-label-sm font-bold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high hover:border-outline active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Chapter
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {nextNote ? (
          <button
            onClick={goNext}
            className="flex-[1.5] flex items-center justify-center gap-2 py-3.5 rounded-xl text-label-sm font-bold btn-primary"
          >
            Next Chapter
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/notes"
            className="flex-[1.5] flex items-center justify-center gap-2 py-3.5 rounded-xl text-label-sm font-bold bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-all"
          >
            Back to Library
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
