'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNotes, getCourses, getTopics, saveCustomNote, type Note } from '@/lib/dataLoader';
import { fetchGitHubNote } from '@/lib/githubFetcher';
import { getProgress, recordNoteCompleted, syncProgressToRemote } from '@/lib/progressManager';
import { useAuth } from '@/components/AuthProvider';
import { markSectionChecked, getUnreadCount } from '@/lib/notifications';

export default function NotesPage() {
  const { profile, user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [completedNotes, setCompletedNotes] = useState<Record<string, boolean>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [noteBodies, setNoteBodies] = useState<Record<string, string>>({});
  const [loadingBody, setLoadingBody] = useState<Record<string, boolean>>({});
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const loadNotes = () => getNotes().then(setNotes);

  useEffect(() => {
    setMounted(true);
    loadNotes();
    getCourses().then(setCourses);
    getTopics().then(setTopics);
    setCompletedNotes(getProgress().completedNotes || {});
    markSectionChecked('notes');
  }, []);

  const handleRefreshGithub = async (note: Note) => {
    const githubUrl = note.githubUrl;
    if (!githubUrl) return;

    setRefreshingId(note.id);
    try {
      const freshNote = await fetchGitHubNote(githubUrl, note.course || note.topic);
      saveCustomNote({
        ...freshNote,
        id: note.id,
        date: new Date().toISOString(),
        label: note.label,
        major: note.major,
        videoUrl: note.videoUrl,
        videoUrls: note.videoUrls,
        githubUrl: note.githubUrl,
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
    return filtered;
  }, [notes, topicFilter, labelFilter, majorFilter, searchQuery]);

  const courseNotesMap = useMemo(() => {
    const map: Record<string, Note[]> = {};
    for (const course of courses) {
      map[course] = [];
    }
    for (const note of filteredNotes) {
      const key = note.course || note.topic || 'Uncategorized';
      if (!map[key]) map[key] = [];
      map[key].push(note);
    }
    return map;
  }, [courses, filteredNotes]);

  const sortedCourseNotes = useMemo(() => {
    const result: Record<string, Note[]> = {};
    for (const [course, courseNotes] of Object.entries(courseNotesMap)) {
      result[course] = [...courseNotes].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
    }
    return result;
  }, [courseNotesMap, sortOrder]);

  const unreadCourseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [course, courseNotes] of Object.entries(sortedCourseNotes)) {
      const count = getUnreadCount('notes', courseNotes);
      if (count > 0) counts[course] = count;
    }
    return counts;
  }, [sortedCourseNotes]);

  const topicColors: Record<string, string> = {
    'Fundamentals of Programming': 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    'Data Structures & Algorithms': 'from-purple-500/20 to-blue-500/20 border-purple-500/30',
    'Object Oriented Programming': 'from-sky-500/20 to-indigo-500/20 border-sky-500/30',
    'Database Systems': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    'Fundamentals of Software Engineering': 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
    'Microcomputer & Interfacing': 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    'Operating Systems': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    'Digital Logic Design': 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    'Computer Architecture & Organization': 'from-red-500/20 to-rose-500/20 border-red-500/30',
    'Data Communication and Computer Networks': 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
    'Computer Systems Security': 'from-lime-500/20 to-green-500/20 border-lime-500/30',
    'Distributed Systems': 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30',
    'Compiler Design': 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30',
    'Introduction to Artificial Intelligence': 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30',
  };
  const topicIcons: Record<string, string> = {
    'Fundamentals of Programming': '💻',
    'Data Structures & Algorithms': '⚡',
    'Object Oriented Programming': '🎯',
    'Database Systems': '🗄️',
    'Fundamentals of Software Engineering': '📐',
    'Microcomputer & Interfacing': '🔌',
    'Operating Systems': '🖥️',
    'Digital Logic Design': '🔲',
    'Computer Architecture & Organization': '🏗️',
    'Data Communication and Computer Networks': '🌐',
    'Computer Systems Security': '🔒',
    'Distributed Systems': '🌍',
    'Compiler Design': '⚙️',
    'Introduction to Artificial Intelligence': '🤖',
  };

  const isGithub = (note: Note) => note.source === 'GitHub';

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown Date';
    return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const toggleNote = async (note: Note) => {
    const id = note.id;
    const willExpand = !expandedNotes[id];
    setExpandedNotes(prev => ({ ...prev, [id]: willExpand }));
    if (willExpand && !noteBodies[id] && !note.body && note.githubUrl) {
      setLoadingBody(prev => ({ ...prev, [id]: true }));
      try {
        const fresh = await fetchGitHubNote(note.githubUrl, note.course || note.topic);
        setNoteBodies(prev => ({ ...prev, [id]: fresh.body || '' }));
      } catch (e) {
        console.error('Failed to fetch note body', e);
      } finally {
        setLoadingBody(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded-xl w-48" />
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-dark-700 rounded-xl" />)}</div>
      </div>
    );
  }

  const allLabels = Array.from(new Set(notes.map(n => n.label).filter(Boolean))) as string[];

  // ── Single course detail view ──
  if (selectedCourse) {
    const courseNotes = sortedCourseNotes[selectedCourse] || [];
    const colors = topicColors[selectedCourse] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    const icon = topicIcons[selectedCourse] || '📖';
    const isComplete = courseNotes.length > 0 && courseNotes.every(n => completedNotes[n.id]);

    return (
      <div className="space-y-6 animate-in">
        {/* Back button + course header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCourse(null)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-dark-600 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center text-lg flex-shrink-0`}>{icon}</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCourse}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{courseNotes.length} chapter{courseNotes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Chapters */}
        {courseNotes.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-gray-400 italic">No chapters in this course yet.</p>
          </div>
        )}

        <div className="space-y-2">
          {courseNotes.map((note) => {
            const isNoteOpen = expandedNotes[note.id];
            const isLoading = loadingBody[note.id];
            const isCompleted = completedNotes[note.id];
            const hasBody = note.body || noteBodies[note.id] || note.githubUrl;

            return (
              <div key={note.id} className={`card overflow-hidden border-gray-200 dark:border-white/5 transition-colors ${isNoteOpen ? 'ring-1 ring-accent-purple/30' : ''}`}>
                <button
                  onClick={() => toggleNote(note)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors text-left"
                >
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isNoteOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold text-sm sm:text-base ${isNoteOpen ? 'text-accent-purple-light' : 'text-gray-900 dark:text-white'}`}>
                        {note.title}
                      </h3>
                      {isCompleted && <span className="text-xs text-emerald-400 font-medium">✅ Done</span>}
                    </div>
                    {note.summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{note.summary}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{formatDate(note.date)}</span>
                    {note.label && <span className="badge bg-gray-100 dark:bg-dark-500 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 hidden sm:inline">{note.label}</span>}
                    {(note.videoUrl || (note.videoUrls && note.videoUrls.length > 0)) && <span className="text-xs text-rose-400">🎬</span>}
                  </div>
                </button>

                {isNoteOpen && (
                  <div className="px-5 pb-6 pt-2 border-t border-gray-200 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {note.key_points && note.key_points.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {note.key_points.map((kp, i) => (
                          <span key={i} className="text-xs bg-gray-100 dark:bg-dark-600 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-dark-400/30">{kp}</span>
                        ))}
                      </div>
                    )}

                    {isLoading ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-full" />
                        <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-5/6" />
                        <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-4/6" />
                      </div>
                    ) : hasBody ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-4 prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-accent-purple-light prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-accent-purple-light prose-pre:bg-gray-100 dark:prose-pre:bg-dark-700 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-dark-400/30 prose-pre:rounded-xl prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-p:text-gray-600 dark:prose-p:text-gray-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {note.body || noteBodies[note.id] || ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4">No content available for this chapter.</p>
                    )}

                    {note.videoUrl && (
                      <div className="mb-4 aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-dark-400/30">
                        <iframe src={note.videoUrl} className="w-full h-full" allowFullScreen title="Video" />
                      </div>
                    )}
                    {note.videoUrls && note.videoUrls.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {note.videoUrls.map((v, i) => (
                          <div key={i} className="aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-dark-400/30">
                            <iframe src={v} className="w-full h-full" allowFullScreen title={`Video ${i + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                    {note.images && note.images.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {note.images.map((img, i) => (
                          <img key={i} src={img} alt={`Image ${i + 1}`} className="rounded-xl border border-gray-200 dark:border-dark-400/30 w-full object-cover shadow-lg" />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-white/5">
                      {!isCompleted ? (
                        <button
                          onClick={() => {
                            recordNoteCompleted(note.id);
                            setCompletedNotes(prev => ({ ...prev, [note.id]: true }));
                            if (user) syncProgressToRemote(user.id);
                          }}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        >
                          Mark as Completed
                        </button>
                      ) : (
                        <span className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅ Completed (+5 XP)</span>
                      )}
                      {isGithub(note) && profile?.username === 'psycho' && (
                        <button
                          onClick={() => handleRefreshGithub(note)}
                          disabled={refreshingId === note.id}
                          className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                        >
                          {refreshingId === note.id ? 'Refreshing...' : '↻ Refresh from GitHub'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {courseNotes.length > 0 && (
          <div className="text-center pt-4">
            <button onClick={() => setSelectedCourse(null)} className="text-sm text-gray-400 hover:text-accent-purple-light transition-colors">
              ← Back to all courses
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── All courses grid ──
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Study Notes</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {notes.length} chapters across {courses.length} courses
        </p>
      </div>

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
          <option value="all">All Courses</option>
          {courses.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}
          className="bg-gray-100 dark:bg-dark-600 border border-gray-200 dark:border-dark-400/50 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-purple focus:outline-none">
          <option value="all">All Labels</option>
          <option value="Course Material">Course Material</option>
          <option value="Syllabus">Syllabus</option>
          <option value="Short Note">Short Note</option>
          {allLabels.filter(l => !['Course Material', 'Syllabus', 'Short Note'].includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="bg-gray-100 dark:bg-dark-600 border border-gray-200 dark:border-dark-400/50 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-purple focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {courses.map((course) => {
          const courseNotes = sortedCourseNotes[course] || [];
          const colors = topicColors[course] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
          const icon = topicIcons[course] || '📖';
          const unreadCount = unreadCourseCounts[course] || 0;

          return (
            <button key={course} onClick={() => setSelectedCourse(course)} className="text-left w-full">
              <div className="relative group glass-card p-5 sm:p-6 overflow-hidden hover:border-accent-purple/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col h-full bg-white dark:bg-black/20 border-gray-200 dark:border-white/5 min-h-[150px] cursor-pointer">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center text-base flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    {icon}
                  </div>
                  {unreadCount > 0 && (
                    <span className="badge bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-accent-purple-light transition-colors line-clamp-2">
                  {course}
                </h3>

                {courseNotes.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed flex-1 italic">
                    No chapters yet
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {courseNotes.length} chapter{courseNotes.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-accent-purple-glow group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-[10px]">
                    Open
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Courses Found</h3>
          <p className="text-gray-500 dark:text-gray-400">Courses will appear here once configured.</p>
        </div>
      )}
    </div>
  );
}
