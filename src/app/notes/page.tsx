'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getNotes, getTopics, deleteCustomNote, saveCustomNote, type Note } from '@/lib/dataLoader';
import { fetchGitHubNote } from '@/lib/githubFetcher';
import { getProgress } from '@/lib/progressManager';
import { useAuth } from '@/components/AuthProvider';

export default function NotesPage() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [completedNotes, setCompletedNotes] = useState<Record<string, boolean>>({});

  const loadNotes = () => getNotes().then(setNotes);

  useEffect(() => {
    setMounted(true);
    loadNotes();
    getTopics().then(setTopics);
    setCompletedNotes(getProgress().completedNotes || {});
  }, []);

  const handleDelete = (noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteConfirm === noteId) {
      deleteCustomNote(noteId);
      setDeleteConfirm(null);
      loadNotes();
    } else {
      setDeleteConfirm(noteId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleRefreshGithub = async (note: Note, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!note.links || note.links.length === 0) return;
    const githubUrl = note.links.find(l => l.includes('github.com') || l.includes('raw.githubusercontent.com'));
    if (!githubUrl) return;

    setRefreshingId(note.id);
    try {
      const freshNote = await fetchGitHubNote(githubUrl, note.course || note.topic);
      // Keep original id and date, update content
      saveCustomNote({
        ...freshNote,
        id: note.id,
        date: new Date().toISOString(),
        label: note.label,
      });
      loadNotes();
    } catch (err) {
      console.error('Failed to refresh from GitHub:', err);
    } finally {
      setRefreshingId(null);
    }
  };

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (topicFilter !== 'all') filtered = filtered.filter((n) => n.topic === topicFilter);
    if (labelFilter !== 'all') filtered = filtered.filter((n) => n.label === labelFilter);
    if (majorFilter !== 'all') filtered = filtered.filter((n) => n.major === majorFilter || n.major === 'Both');
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          (n.course && n.course.toLowerCase().includes(query)) ||
          (n.summary && n.summary.toLowerCase().includes(query)) ||
          (n.body && n.body.toLowerCase().includes(query)) ||
          (n.key_points && n.key_points.some((kp) => kp.toLowerCase().includes(query)))
      );
    }
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [notes, topicFilter, labelFilter, majorFilter, searchQuery, sortOrder]);

  const topicColors: Record<string, string> = {
    'Algorithms': 'from-purple-500/20 to-blue-500/20 border-purple-500/30',
    'Operating Systems': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    'Database Systems': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    'Networking': 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
  };
  const topicIcons: Record<string, string> = {
    'Algorithms': '⚡', 'Operating Systems': '🖥️', 'Database Systems': '🗄️', 'Networking': '🌐',
  };

  const isEditable = (note: Note) => {
    const isAdmin = profile?.username === 'psycho';
    return isAdmin && note.source !== 'system';
  };
  const isGithub = (note: Note) => note.source === 'GitHub';

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown Date';
    return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-dark-700 rounded-xl" />)}</div>
      </div>
    );
  }

  const allLabels = Array.from(new Set(notes.map(n => n.label).filter(Boolean))) as string[];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Study Notes</h1>
        <p className="text-gray-400 text-sm mt-1">{filteredNotes.length} notes available across {topics.length} topics</p>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..."
            className="input-field pl-10 h-11" />
        </div>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
          className="input-field h-11 w-fit min-w-[140px]">
          <option value="all">All Topics</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}
          className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none">
          <option value="all">All Labels</option>
          <option value="Course Material">Course Material</option>
          <option value="Syllabus">Syllabus</option>
          <option value="Short Note">Short Note</option>
          {allLabels.filter(l => !['Course Material', 'Syllabus', 'Short Note'].includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredNotes.map((note) => {
          const colors = topicColors[note.topic] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
          const icon = topicIcons[note.topic] || '📖';
          const editable = isEditable(note);
          const github = isGithub(note);

          return (
            <div key={note.id} className="card overflow-hidden hover:ring-1 hover:ring-accent-purple/50 transition-all duration-300 group relative">
              <Link href={`/notes/view?id=${note.id}`} className="block">
                <div className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-[#11152a] bg-gradient-to-br ${colors} flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-accent-purple-light font-medium uppercase tracking-wider truncate">
                          {note.course || note.topic}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">• {formatDate(note.date)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mt-1 pr-16 group-hover:text-accent-purple-light transition-colors line-clamp-2">
                        {note.title}
                      </h3>
                    </div>
                  </div>
                  {note.summary && (
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed line-clamp-2 pl-16">{note.summary}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-dark-400/20 flex flex-wrap items-center gap-2">
                    {completedNotes[note.id] && (
                      <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-xs">✅ Completed</span>
                    )}
                    {note.source === 'system' || !note.source
                      ? <span className="badge bg-dark-500 text-gray-400 text-xs">Built-in</span>
                      : note.source === 'GitHub'
                      ? <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">GitHub</span>
                      : <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-xs">{note.source}</span>
                    }
                    {note.label && <span className="badge bg-dark-500 text-gray-300 border border-dark-400 text-xs">{note.label}</span>}
                    {note.major && note.major !== 'Both' && (
                      <span className="badge bg-accent-purple/10 text-accent-purple-light border border-accent-purple/20 text-xs">{note.major}</span>
                    )}
                    {note.body && (
                      <span className="badge bg-accent-purple/10 text-accent-purple-light border border-accent-purple/30 text-xs">
                        {Math.max(1, Math.ceil(note.body.split(/\s+/).length / 200))} min read
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Action buttons (only for non-system notes) */}
              {editable && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {/* GitHub refresh */}
                  {github && (
                    <button
                      onClick={(e) => handleRefreshGithub(note, e)}
                      disabled={refreshingId === note.id}
                      title="Refresh from GitHub"
                      className="w-8 h-8 rounded-lg bg-dark-700/90 border border-dark-400/30 hover:border-blue-500/50 flex items-center justify-center transition-all hover:bg-blue-500/10"
                    >
                      {refreshingId === note.id ? (
                        <svg className="w-3.5 h-3.5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(note.id, e)}
                    title={deleteConfirm === note.id ? 'Click again to confirm' : 'Delete note'}
                    className={`w-8 h-8 rounded-lg bg-dark-700/90 border flex items-center justify-center transition-all ${
                      deleteConfirm === note.id
                        ? 'border-red-500/60 bg-red-500/15 hover:bg-red-500/25'
                        : 'border-dark-400/30 hover:border-red-500/50 hover:bg-red-500/10'
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${deleteConfirm === note.id ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredNotes.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Notes Found</h3>
          <p className="text-gray-400">Try adjusting your search or filter settings.</p>
        </div>
      )}
    </div>
  );
}
