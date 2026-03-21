'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getNotes, getTopics, type Note } from '@/lib/dataLoader';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getNotes().then(setNotes);
    getTopics().then(setTopics);
  }, []);

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (topicFilter !== 'all') {
      filtered = filtered.filter((n) => n.topic === topicFilter);
    }
    if (labelFilter !== 'all') {
      filtered = filtered.filter((n) => n.label === labelFilter);
    }
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
    
    // Sorting by date
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [notes, topicFilter, labelFilter, searchQuery, sortOrder]);

  const topicColors: Record<string, string> = {
    'Algorithms': 'from-purple-500/20 to-blue-500/20 border-purple-500/30',
    'Operating Systems': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    'Database Systems': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    'Networking': 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
  };

  const topicIcons: Record<string, string> = {
    'Algorithms': '⚡',
    'Operating Systems': '🖥️',
    'Database Systems': '🗄️',
    'Networking': '🌐',
  };

  const SourceBadge = ({ source }: { source?: string }) => {
    if (!source || source === 'system') return <span className="badge bg-dark-500 text-gray-400 text-xs">Built-in</span>;
    if (source === 'GitHub') return <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">GitHub</span>;
    if (source === 'Local') return <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-xs">Local</span>;
    return <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">{source}</span>;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown Date';
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-dark-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const allLabels = Array.from(new Set(notes.map(n => n.label).filter(Boolean))) as string[];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Study Notes</h1>
        <p className="text-gray-400 text-sm mt-1">
          {filteredNotes.length} notes available across {topics.length} topics
        </p>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-dark-600 border border-dark-400/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-purple focus:outline-none"
          />
        </div>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none"
        >
          <option value="all">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none"
        >
          <option value="all">All Labels</option>
          <option value="Course Material">Course Material</option>
          <option value="Syllabus">Syllabus</option>
          <option value="Short Note">Short Note</option>
          {allLabels.filter(l => !['Course Material', 'Syllabus', 'Short Note'].includes(l)).map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredNotes.map((note) => {
          const colors = topicColors[note.topic] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
          const icon = topicIcons[note.topic] || '📖';

          return (
            <Link
              href={`/notes/view?id=${note.id}`}
              key={note.id}
              className="card overflow-hidden hover:ring-1 hover:ring-accent-purple/50 transition-all duration-300 group block"
            >
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-accent-purple-light font-medium uppercase tracking-wider truncate">
                        {note.course || note.topic}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        • {formatDate(note.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mt-1 pr-2 group-hover:text-accent-purple-light transition-colors line-clamp-2">
                      {note.title}
                    </h3>
                  </div>
                </div>
                
                {note.summary && (
                  <p className="text-gray-400 text-sm mt-3 leading-relaxed line-clamp-2 pl-16">
                    {note.summary}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-dark-400/20 flex flex-wrap items-center gap-2">
                  <SourceBadge source={note.source} />
                  {note.label && (
                    <span className="badge bg-dark-500 text-gray-300 border border-dark-400 text-xs">
                      {note.label}
                    </span>
                  )}
                  {note.body && (
                    <span className="badge bg-accent-purple/10 text-accent-purple-light border border-accent-purple/30 text-xs">
                      {Math.max(1, Math.ceil(note.body.split(/\s+/).length / 200))} min read
                    </span>
                  )}
                </div>
              </div>
            </Link>
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
