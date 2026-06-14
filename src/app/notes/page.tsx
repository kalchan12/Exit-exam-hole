'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getNotes, getCourses, getTopics, type Note } from '@/lib/dataLoader';
import { getProgress } from '@/lib/progressManager';
import { markSectionChecked, getUnreadCount } from '@/lib/notifications';
import { BookOpen, Search, ChevronLeft, ChevronRight, CheckCircle, Video } from 'lucide-react';

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
      <div className="animate-pulse space-y-6 py-4">
        <div className="h-10 bg-surface-container-highest rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 bg-surface-container-highest rounded-xl" />)}
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
      <div className="space-y-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCourse(null)} className="w-9 h-9 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center text-lg shrink-0`}>{icon}</div>
          <div>
            <h1 className="text-headline-xl-mobile font-bold text-on-surface">{selectedCourse}</h1>
            <p className="text-label-sm text-on-surface-variant">{courseNotes.length} chapter{courseNotes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {courseNotes.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-on-surface-variant italic">No chapters in this course yet.</p>
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
                className="card p-4 hover:border-primary-fixed-dim transition-all duration-300 flex flex-col min-h-[160px] group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-label-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {note.title}
                    </h3>
                  </div>
                </div>

                {note.summary && (
                  <p className="text-label-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-3 flex-1">
                    {note.summary}
                  </p>
                )}

                <div className="mt-auto pt-3 border-t border-outline-variant flex items-center justify-between text-label-xs font-bold tracking-wider text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span>{formatDate(note.date)}</span>
                    {(note.videoUrl || (note.videoUrls && note.videoUrls.length > 0)) && (
                      <Video className="w-3 h-3 text-secondary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-secondary" />}
                    {note.label && (
                      <span className="badge bg-surface-container text-on-surface-variant">
                        {note.label}
                      </span>
                    )}
                    <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Open
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {courseNotes.length > 0 && (
          <div className="text-center pt-2">
            <button onClick={() => setSelectedCourse(null)} className="text-label-sm text-on-surface-variant hover:text-primary transition-colors">
              &larr; Back to all courses
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── All courses grid ──
  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-headline-2xl font-bold text-on-surface">Study Notes</h1>
        <p className="text-body-base text-on-surface-variant mt-1">
          {notes.length} chapters across {courses.length} courses
        </p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..."
            className="input-field pl-10" />
        </div>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
          className="input-field w-fit min-w-[140px]">
          <option value="all">All Courses</option>
          {courses.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}
          className="input-field w-fit min-w-[130px]">
          <option value="all">All Labels</option>
          <option value="Course Material">Course Material</option>
          <option value="Syllabus">Syllabus</option>
          <option value="Short Note">Short Note</option>
          {allLabels.filter(l => !['Course Material', 'Syllabus', 'Short Note'].includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="input-field w-fit min-w-[130px]">
          <option value="asc">Chapter 1 &rarr; N</option>
          <option value="desc">Chapter N &rarr; 1</option>
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
              <div className="card p-5 sm:p-6 flex flex-col h-full min-h-[150px] cursor-pointer hover:border-primary-fixed-dim transition-all duration-300 group">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform`}>
                    {icon}
                  </div>
                  {unreadCount > 0 && (
                    <span className="badge bg-primary-container text-on-primary-container text-label-xs font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <h3 className="text-label-sm font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course}
                </h3>

                {courseNotes.length === 0 && (
                  <p className="text-label-xs text-on-surface-variant flex-1 italic">
                    No chapters yet
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between text-label-xs font-bold tracking-wider text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {courseNotes.length} chapter{courseNotes.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-label-xs">
                    Open
                    <ChevronRight className="w-3 h-3" />
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
          <h3 className="text-headline-xl-mobile font-semibold text-on-surface mb-2">No Courses Found</h3>
          <p className="text-on-surface-variant">Courses will appear here once configured.</p>
        </div>
      )}
    </div>
  );
}
