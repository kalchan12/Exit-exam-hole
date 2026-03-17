'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNotes, getTopics, type Note } from '@/lib/dataLoader';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
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
  }, [notes, topicFilter, searchQuery]);

  const toggleExpand = (noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

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

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-dark-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

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
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
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
      </div>

      {/* Notes Grid */}
      <div className="space-y-4">
        {filteredNotes.map((note) => {
          const isExpanded = expandedNotes.has(note.id);
          const colors = topicColors[note.topic] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
          const icon = topicIcons[note.topic] || '📖';

          return (
            <div
              key={note.id}
              className={`card overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-accent-purple/30' : ''}`}
            >
              <button
                onClick={() => toggleExpand(note.id)}
                className="w-full text-left p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center text-xl flex-shrink-0`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-accent-purple-light font-medium uppercase tracking-wider">
                            {note.course || note.topic}
                          </span>
                          <SourceBadge source={note.source} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mt-1">
                          {note.title}
                        </h3>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {note.summary && (
                      <p className="text-gray-400 text-sm mt-2 leading-relaxed line-clamp-2">
                        {note.summary}
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 sm:px-6 pb-6 animate-slide-up">
                  <div className="ml-0 sm:ml-16 border-t border-dark-400/20 pt-4">
                    
                    {note.body ? (
                      <div className="prose prose-invert prose-purple max-w-none text-sm text-gray-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {note.body}
                        </ReactMarkdown>
                      </div>
                    ) : note.key_points ? (
                      <>
                        <h4 className="text-sm font-semibold text-accent-purple-light mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          Key Points
                        </h4>
                        <ul className="space-y-2.5">
                          {note.key_points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm">
                              <span className="w-6 h-6 rounded-md bg-accent-purple/20 text-accent-purple-light flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="text-gray-300 leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}

                    {/* Images */}
                    {note.images && note.images.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-4">
                        {note.images.map((img, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={img} alt={`Note attachment ${i+1}`} className="rounded-lg border border-dark-400/30 max-h-64 object-contain" />
                        ))}
                      </div>
                    )}

                    {/* Cloud or External Download Links */}
                    {note.links && note.links.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        {note.links.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-2">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            External Link {note.links!.length > 1 ? i + 1 : ''}
                          </a>
                        ))}
                      </div>
                    )}

                  </div>
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
