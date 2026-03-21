'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getBytes, getTopics, type Byte } from '@/lib/dataLoader';

export default function BytesPage() {
  const [bytes, setBytes] = useState<Byte[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getBytes().then(setBytes);
    getTopics().then(setTopics);
  }, []);

  const filteredBytes = useMemo(() => {
    let filtered = bytes;
    if (topicFilter !== 'all') {
      filtered = filtered.filter((b) => b.topic === topicFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.content.toLowerCase().includes(query) ||
          b.topic.toLowerCase().includes(query)
      );
    }
    // Sort Newest first
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [bytes, topicFilter, searchQuery]);

  const topicColors: Record<string, string> = {
    'Algorithms': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    'Operating Systems': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    'Database Systems': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    'Networking': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-dark-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <svg className="w-8 h-8 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Learning Bytes
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Bite-sized, focused lessons to master specific topics quickly.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learning bytes..."
            className="w-full bg-dark-600 border border-dark-400/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none"
          />
        </div>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-cyan focus:outline-none"
        >
          <option value="all">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Bytes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBytes.map((byte) => {
          const badgeClass = topicColors[byte.topic] || 'text-gray-400 border-gray-500/30 bg-gray-500/10';
          
          return (
            <Link
              href={`/bytes/view?id=${byte.id}`}
              key={byte.id}
              className="card p-6 overflow-hidden hover:ring-1 hover:ring-accent-cyan/50 transition-all duration-300 group flex flex-col h-full bg-dark-800/80 hover:bg-dark-700/80"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border ${badgeClass}`}>
                  {byte.topic}
                </span>
                {byte.date && (
                  <span className="text-xs text-gray-500">
                    {new Date(byte.date).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-accent-cyan-light transition-colors line-clamp-2">
                {byte.title}
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                {byte.content}
              </p>
              
              <div className="mt-auto pt-4 border-t border-dark-400/30 flex items-center justify-between text-sm">
                <div className="flex gap-3">
                  {byte.relatedQuestionIds && byte.relatedQuestionIds.length > 0 && (
                    <span className="flex items-center gap-1.5 text-accent-purple-light" title="Features interactive questions">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {byte.relatedQuestionIds.length} Qs
                    </span>
                  )}
                  {byte.images && byte.images.length > 0 && (
                    <span className="flex items-center gap-1.5 text-gray-400" title="Contains media">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  )}
                  {byte.videoUrl && (
                    <span className="flex items-center gap-1.5 text-red-400" title="Contains video">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className="text-accent-cyan text-xs font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Read
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredBytes.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4 text-accent-cyan">⚡</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Bytes Found</h3>
          <p className="text-gray-400">There are no bytes available for this criteria. Create one in the Upload section!</p>
        </div>
      )}
    </div>
  );
}
