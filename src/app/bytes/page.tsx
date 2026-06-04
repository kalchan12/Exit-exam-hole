'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getBytes, getCourses, deleteCustomByte, type Byte } from '@/lib/dataLoader';
import { clearGitHubCache } from '@/lib/githubFetcher';

const FolderIcon = ({ className = "w-10 h-10 text-accent-cyan" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0120.25 21H3.75A2.25 2.25 0 011.5 18.75v-4.5A2.25 2.25 0 013.75 13.5zm0-3h16.5a1.5 1.5 0 001.5-1.5V6.75A1.5 1.5 0 0020.25 5.25H9.75a1.5 1.5 0 01-1.12-.5l-1.01-1.26a1.5 1.5 0 00-1.12-.5H3.75A1.5 1.5 0 002.25 4.5v4.25a1.5 1.5 0 001.5 1.5z" />
  </svg>
);

const DocumentIcon = ({ className = "w-6 h-6 text-gray-400" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export default function BytesPage() {
  const [bytes, setBytes] = useState<Byte[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [currentSubTopic, setCurrentSubTopic] = useState<string | null>(null);
  const [majorFilter, setMajorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadBytes = () => getBytes().then(setBytes);

  useEffect(() => {
    setMounted(true);
    loadBytes();
    getCourses().then(setCourses);
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

  // Filtered bytes based on major and search (for search view) or folders (for folder view)
  const filteredBytes = useMemo(() => {
    let filtered = bytes;

    // Apply major filter first
    if (majorFilter !== 'all') {
      filtered = filtered.filter((b) => b.major === majorFilter || b.major === 'Both');
    }

    // Apply search query globally (flat search results) or folder structure
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.topic.toLowerCase().includes(query) ||
          b.content.toLowerCase().includes(query) ||
          (b.sub_topic && b.sub_topic.toLowerCase().includes(query))
      );
    } else {
      // Normal hierarchical filtering
      if (currentSubject) {
        filtered = filtered.filter((b) => b.topic === currentSubject);
      }
      if (currentSubTopic) {
        filtered = filtered.filter((b) => (b.sub_topic || 'General') === currentSubTopic);
      }
    }

    // Sort newest first
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [bytes, currentSubject, currentSubTopic, majorFilter, searchQuery]);

  // Compute counts for folder display based on major filter
  const bytesForFolderCount = useMemo(() => {
    if (majorFilter === 'all') return bytes;
    return bytes.filter((b) => b.major === majorFilter || b.major === 'Both');
  }, [bytes, majorFilter]);

  // Calculate subject counts
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bytesForFolderCount.forEach((b) => {
      counts[b.topic] = (counts[b.topic] || 0) + 1;
    });
    return counts;
  }, [bytesForFolderCount]);

  // Calculate unique subtopics inside active subject
  const subTopics = useMemo(() => {
    if (!currentSubject) return [];
    const subjectBytes = bytesForFolderCount.filter((b) => b.topic === currentSubject);
    const subSet = new Set(subjectBytes.map((b) => b.sub_topic || 'General'));
    return Array.from(subSet).sort();
  }, [bytesForFolderCount, currentSubject]);

  // Calculate sub-topic counts
  const subTopicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!currentSubject) return counts;
    const subjectBytes = bytesForFolderCount.filter((b) => b.topic === currentSubject);
    subjectBytes.forEach((b) => {
      const key = b.sub_topic || 'General';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [bytesForFolderCount, currentSubject]);

  const topicColors: Record<string, string> = {
    'Algorithms': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    'Operating Systems': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    'Database Systems': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    'Networking': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  };

  const getTopicColor = (topic: string) => {
    return topicColors[topic] || 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
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
    <div className="space-y-6 animate-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            Learning Bytes
            <span className="badge bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 mt-1">Matrix</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-widest">
            {searchQuery 
              ? `Found ${filteredBytes.length} bytes matching search`
              : !currentSubject 
                ? `Structured index of ${courses.length} default & custom courses`
                : currentSubTopic 
                  ? `${filteredBytes.length} modules in ${currentSubject} › ${currentSubTopic}`
                  : `${subTopics.length} sub-folders in ${currentSubject}`}
          </p>
        </div>

        {bytes.some(b => b.githubUrl) && (
          <button 
            onClick={handleRefreshGithub}
            className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/30 transition-all group"
          >
            <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh GitHub Cache
          </button>
        )}
      </div>

      {/* Search & Filter Panel */}
      <div className="glass-card p-4 flex flex-col sm:flex-row flex-wrap gap-3 border-white/5 bg-black/40">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all learning bytes globally..."
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none transition-all font-bold tracking-wide"
          />
        </div>
        <select 
          value={majorFilter} 
          onChange={(e) => setMajorFilter(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-400 font-bold uppercase tracking-wider focus:border-accent-purple focus:outline-none cursor-pointer"
        >
          <option value="all">Any Major</option>
          <option value="CSE">CSE Focus</option>
          <option value="Software">Software Focus</option>
        </select>
      </div>

      {/* Navigation Breadcrumbs (Bypassed if search is active) */}
      {!searchQuery && (
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 bg-black/40 p-4 rounded-xl border border-white/5">
          <button 
            onClick={() => { setCurrentSubject(null); setCurrentSubTopic(null); }}
            className={`hover:text-white transition-colors flex items-center gap-1.5 ${!currentSubject ? 'text-white' : ''}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Matrix
          </button>
          
          {currentSubject && (
            <>
              <span className="text-gray-700 font-black">/</span>
              <button 
                onClick={() => { setCurrentSubTopic(null); }}
                className={`hover:text-white transition-colors ${!currentSubTopic ? 'text-accent-cyan' : ''}`}
              >
                {currentSubject}
              </button>
            </>
          )}

          {currentSubTopic && (
            <>
              <span className="text-gray-700 font-black">/</span>
              <span className="text-accent-purple">
                {currentSubTopic}
              </span>
            </>
          )}
        </div>
      )}

      {/* RENDER VIEW PORTIONS */}
      {searchQuery ? (
        // Flat search results list
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBytes.map((byte) => (
            <ByteCard key={byte.id} byte={byte} onDelete={handleDelete} deleteConfirm={deleteConfirm} getTopicColor={getTopicColor} />
          ))}
          {filteredBytes.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center border-white/5">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">No Match Found</h3>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Try relaxing your search terms or changing major filter.</p>
            </div>
          )}
        </div>
      ) : !currentSubject ? (
        // Root View: List of Subjects
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {courses.map((course) => {
            const count = subjectCounts[course] || 0;
            return (
              <button
                key={course}
                onClick={() => {
                  setCurrentSubject(course);
                  setCurrentSubTopic(null);
                }}
                className="group text-left p-5 rounded-2xl border border-white/5 bg-black/20 hover:border-accent-cyan/40 hover:bg-[#11152a] hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <FolderIcon className="w-6 h-6 text-accent-cyan" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-sm truncate leading-tight group-hover:text-accent-cyan-light transition-colors">
                    {course}
                  </h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider mt-1.5">
                    {count} {count === 1 ? 'Byte' : 'Bytes'}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-20 bg-accent-cyan transition-opacity pointer-events-none" />
              </button>
            );
          })}
        </div>
      ) : !currentSubTopic ? (
        // Subject View: List of Sub-topics
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subTopics.map((sub) => {
            const count = subTopicCounts[sub] || 0;
            return (
              <button
                key={sub}
                onClick={() => {
                  setCurrentSubTopic(sub);
                }}
                className="group text-left p-5 rounded-2xl border border-white/5 bg-black/20 hover:border-accent-purple/40 hover:bg-[#11152a] hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <FolderIcon className="w-6 h-6 text-accent-purple" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-sm truncate leading-tight group-hover:text-accent-purple-light transition-colors">
                    {sub}
                  </h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider mt-1.5">
                    {count} {count === 1 ? 'Byte' : 'Bytes'}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-20 bg-accent-purple transition-opacity pointer-events-none" />
              </button>
            );
          })}
          {subTopics.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center border-white/5 bg-black/20">
              <div className="text-3xl mb-4 text-accent-cyan">📂</div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">Empty Folder</h3>
              <p className="text-gray-500 text-xs font-bold mt-1 uppercase">There are no sub-topics created in this course yet.</p>
            </div>
          )}
        </div>
      ) : (
        // Sub-topic View: List of actual Bytes
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBytes.map((byte) => (
            <ByteCard key={byte.id} byte={byte} onDelete={handleDelete} deleteConfirm={deleteConfirm} getTopicColor={getTopicColor} />
          ))}
          {filteredBytes.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center border-white/5 bg-black/20">
              <div className="text-3xl mb-4 text-accent-cyan">⚡</div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">No Bytes</h3>
              <p className="text-gray-500 text-xs font-bold mt-1 uppercase">No bytes in this sub-topic matching your filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ByteCard({ 
  byte, 
  onDelete, 
  deleteConfirm, 
  getTopicColor 
}: { 
  byte: Byte; 
  onDelete: (id: string, e: React.MouseEvent) => void; 
  deleteConfirm: string | null;
  getTopicColor: (topic: string) => string;
}) {
  return (
    <div className="relative group glass-card p-5 sm:p-6 overflow-hidden hover:border-accent-cyan/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 flex flex-col h-full bg-black/20 border-white/5">
      <Link href={`/bytes/view?id=${byte.id}`} className="flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`badge ${getTopicColor(byte.topic)} text-[10px] font-black uppercase tracking-wider px-2 py-0.5`}>
            {byte.topic}
          </span>
          {byte.sub_topic && (
            <span className="badge bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
              {byte.sub_topic}
            </span>
          )}
          {byte.major && byte.major !== 'Both' && (
            <span className="badge bg-accent-purple/10 text-accent-purple-light border border-accent-purple/20 text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
              {byte.major}
            </span>
          )}
        </div>
        
        <h3 className="text-sm sm:text-base font-bold text-white mb-2 group-hover:text-accent-cyan-light transition-colors line-clamp-2">
          {byte.title}
        </h3>
        
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-6 flex-1">
          {byte.content}
        </p>
        
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-500">
          <div className="flex gap-3">
            {byte.relatedQuestionIds && byte.relatedQuestionIds.length > 0 && (
              <span className="flex items-center gap-1 text-accent-purple-light" title="Interactive reinforcement questions">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {byte.relatedQuestionIds.length} Qs
              </span>
            )}
            {byte.images && byte.images.length > 0 && (
              <span className="flex items-center gap-1 text-gray-400" title="Contains visual assets">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Media
              </span>
            )}
          </div>
          <span className="text-accent-cyan group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-[10px]">
            Read
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
      
      {byte.source !== 'system' && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => onDelete(byte.id, e)}
            title={deleteConfirm === byte.id ? 'Click again to confirm delete' : 'Delete byte'}
            className={`w-7 h-7 rounded-lg bg-black/40 border flex items-center justify-center transition-all ${
              deleteConfirm === byte.id
                ? 'border-red-500/60 bg-red-500/10 hover:bg-red-500/20'
                : 'border-white/10 hover:border-red-500/50 hover:bg-red-500/10'
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${deleteConfirm === byte.id ? 'text-red-400' : 'text-gray-400 group-hover:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
