'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getNotes, getCourses, getTopics, type Note } from '@/lib/dataLoader';
import { getProgress } from '@/lib/progressManager';
import { markSectionChecked, getUnreadCount } from '@/lib/notifications';

function extractChapterNum(title: string): number {
  const match = title.match(/Chapter\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [completedNotes, setCompletedNotes] = useState<Record<string, boolean>>({});
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const loadNotes = () => getNotes().then(setNotes);

  useEffect(() => {
    setMounted(true);
    Promise.all([loadNotes(), getCourses().then(setCourses)]).then(() => setLoaded(true));
    getTopics().then(setTopics);
    setCompletedNotes(getProgress().completedNotes || {});
    markSectionChecked('notes');
  }, []);

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
        const numA = extractChapterNum(a.title);
        const numB = extractChapterNum(b.title);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
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

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown Date';
    return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!mounted || !loaded) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-gray-200 dark:bg-dark-700 rounded-xl" />)}
        </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {courseNotes.map((note) => {
            const isCompleted = completedNotes[note.id];
            const colors = topicColors[selectedCourse] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';

            return (
              <Link
                key={note.id}
                href={`/notes/view?id=${note.id}`}
                className="group glass-card p-4 overflow-hidden hover:border-accent-purple/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col bg-white dark:bg-black/20 border-gray-200 dark:border-white/5 min-h-[160px]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center text-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-accent-purple-light transition-colors line-clamp-2 leading-snug">
                      {note.title}
                    </h3>
                  </div>
                </div>

                {note.summary && (
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed line-clamp-2 mb-3 flex-1">
                    {note.summary}
                  </p>
                )}

                <div className="mt-auto pt-3 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>{formatDate(note.date)}</span>
                    {(note.videoUrl || (note.videoUrls && note.videoUrls.length > 0)) && (
                      <span className="text-rose-400" title="Has video">🎬</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && <span className="text-emerald-400">✅ Done</span>}
                    {note.label && (
                      <span className="badge bg-gray-100 dark:bg-dark-500 text-gray-600 dark:text-gray-300 px-1.5 py-0.5">
                        {note.label}
                      </span>
                    )}
                    <span className="text-accent-purple-glow group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Open
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
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
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="bg-gray-100 dark:bg-dark-600 border border-gray-200 dark:border-dark-400/50 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent-purple focus:outline-none">
          <option value="asc">Chapter 1 → N</option>
          <option value="desc">Chapter N → 1</option>
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
