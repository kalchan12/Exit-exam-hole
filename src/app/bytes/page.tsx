'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getBytes, getTopics, deleteCustomByte, type Byte } from '@/lib/dataLoader';
import { clearGitHubCache } from '@/lib/githubFetcher';

export default function BytesPage() {
  const [bytes, setBytes] = useState<Byte[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadBytes = () => getBytes().then(setBytes);

  useEffect(() => {
    setMounted(true);
    loadBytes();
    getTopics().then(setTopics);
  }, []);

  const handleDelete = (byteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteConfirm === byteId) {
      deleteCustomByte(byteId);
      setDeleteConfirm(null);
      loadBytes();
    } else {
      setDeleteConfirm(byteId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleRefreshGithub = async () => {
    clearGitHubCache();
    await loadBytes();
  };

  const filteredBytes = useMemo(() => {
    let filtered = bytes;
    if (topicFilter !== 'all') {
      filtered = filtered.filter((b) => b.topic === topicFilter);
    }
    if (majorFilter !== 'all') {
      filtered = filtered.filter((b) => b.major === majorFilter || b.major === 'Both');
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.topic.toLowerCase().includes(query) ||
          b.content.toLowerCase().includes(query)
      );
    }
    
    // Sort newest first
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [bytes, topicFilter, majorFilter, searchQuery]);

  const topicColors: Record<string, string> = {
    'Algorithms': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    'Operating Systems': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    'Database Systems': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    'Networking': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-dark-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Learning Bytes
          <span className="badge bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 text-xs mt-1">Beta</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {filteredBytes.length} quick learning modules across {topics.length} topics
        </p>
      </div>

      {bytes.some(b => b.githubUrl) && (
        <div className="flex justify-end">
          <button 
            onClick={handleRefreshGithub}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/30 transition-all group"
          >
            <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh from GitHub
          </button>
        </div>
      )}

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
            placeholder="Search learning bytes..."
            className="w-full bg-dark-600 border border-dark-400/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 transition-all"
          />
        </div>
        <select 
            value={majorFilter} 
            onChange={(e) => setMajorFilter(e.target.value)}
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none"
        >
            <option value="all">Any Major</option>
            <option value="CSE">CSE Only</option>
            <option value="Software">Software Only</option>
        </select>

        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 transition-all"
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
            <div key={byte.id} className="relative group card p-4 sm:p-6 overflow-hidden hover:ring-1 hover:ring-accent-cyan/50 transition-all duration-300 flex flex-col h-full bg-[#11152a]">
              <Link
                href={`/bytes/view?id=${byte.id}`}
                className="flex-1 flex flex-col"
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`badge ${topicColors[byte.topic] || 'bg-dark-500 text-gray-400'} text-xs`}>
                    {byte.topic}
                  </span>
                  {byte.major && byte.major !== 'Both' && (
                    <span className="badge bg-accent-purple/10 text-accent-purple-light border border-accent-purple/20 text-xs">{byte.major}</span>
                  )}
                  {byte.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(byte.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 group-hover:text-accent-cyan-light transition-colors line-clamp-2">
                  {byte.title}
                </h3>
                
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4 sm:mb-6 flex-1">
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
              
              {byte.source !== 'system' && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => handleDelete(byte.id, e)}
                    title={deleteConfirm === byte.id ? 'Click again to confirm' : 'Delete byte'}
                    className={`w-8 h-8 rounded-lg bg-dark-700/90 border flex items-center justify-center transition-all ${
                      deleteConfirm === byte.id
                        ? 'border-red-500/60 bg-red-500/15 hover:bg-red-500/25'
                        : 'border-dark-400/30 hover:border-red-500/50 hover:bg-red-500/10'
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${deleteConfirm === byte.id ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
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
