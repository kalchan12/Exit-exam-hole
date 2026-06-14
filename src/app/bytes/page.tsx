'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getBytes, getCourses, deleteCustomByte, type Byte } from '@/lib/dataLoader';
import { clearGitHubCache } from '@/lib/githubFetcher';
import { markSectionChecked } from '@/lib/notifications';
import { Search, RefreshCw, Folder, FileText, ChevronRight, Home, Image, HelpCircle, Trash2 } from 'lucide-react';

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
    markSectionChecked('bytes');
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

    if (majorFilter !== 'all') {
      filtered = filtered.filter((b) => b.major === majorFilter || b.major === 'Both');
    }

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
      if (currentSubject) {
        filtered = filtered.filter((b) => b.topic === currentSubject);
      }
      if (currentSubTopic) {
        filtered = filtered.filter((b) => (b.sub_topic || 'General') === currentSubTopic);
      }
    }

    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [bytes, currentSubject, currentSubTopic, majorFilter, searchQuery]);

  const bytesForFolderCount = useMemo(() => {
    if (majorFilter === 'all') return bytes;
    return bytes.filter((b) => b.major === majorFilter || b.major === 'Both');
  }, [bytes, majorFilter]);

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bytesForFolderCount.forEach((b) => {
      counts[b.topic] = (counts[b.topic] || 0) + 1;
    });
    return counts;
  }, [bytesForFolderCount]);

  const subTopics = useMemo(() => {
    if (!currentSubject) return [];
    const subjectBytes = bytesForFolderCount.filter((b) => b.topic === currentSubject);
    const subSet = new Set(subjectBytes.map((b) => b.sub_topic || 'General'));
    return Array.from(subSet).sort();
  }, [bytesForFolderCount, currentSubject]);

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
      <div className="animate-pulse space-y-6 py-4">
        <div className="h-10 bg-surface-container-highest rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-surface-container-highest rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-headline-2xl font-bold text-on-surface flex items-center gap-2">
            Learning Bytes
            <span className="badge bg-primary-container text-on-primary-container text-label-xs font-bold">Matrix</span>
          </h1>
          <p className="text-label-sm text-on-surface-variant mt-1 font-medium tracking-wider">
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
            className="btn-ghost text-label-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            Refresh GitHub Cache
          </button>
        )}
      </div>

      {/* Search & Filter Panel */}
      <div className="card p-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all learning bytes globally..."
            className="input-field pl-10"
          />
        </div>
        <select 
          value={majorFilter} 
          onChange={(e) => setMajorFilter(e.target.value)}
          className="input-field w-fit min-w-[130px]"
        >
          <option value="all">Any Major</option>
          <option value="CSE">CSE Focus</option>
          <option value="Software">Software Focus</option>
        </select>
      </div>

      {/* Navigation Breadcrumbs */}
      {!searchQuery && (
        <div className="flex items-center gap-2 text-label-xs font-bold tracking-wider text-on-surface-variant bg-surface-container p-4 rounded-xl border border-outline-variant">
          <button 
            onClick={() => { setCurrentSubject(null); setCurrentSubTopic(null); }}
            className={`hover:text-on-surface transition-colors flex items-center gap-1.5 ${!currentSubject ? 'text-on-surface' : ''}`}
          >
            <Home className="w-3.5 h-3.5" />
            Matrix
          </button>
          
          {currentSubject && (
            <>
              <span className="text-outline font-bold">/</span>
              <button 
                onClick={() => { setCurrentSubTopic(null); }}
                className={`hover:text-on-surface transition-colors ${!currentSubTopic ? 'text-primary' : ''}`}
              >
                {currentSubject}
              </button>
            </>
          )}

          {currentSubTopic && (
            <>
              <span className="text-outline font-bold">/</span>
              <span className="text-primary">
                {currentSubTopic}
              </span>
            </>
          )}
        </div>
      )}

      {/* RENDER VIEW PORTIONS */}
      {searchQuery ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBytes.map((byte) => (
            <ByteCard key={byte.id} byte={byte} onDelete={handleDelete} deleteConfirm={deleteConfirm} getTopicColor={getTopicColor} />
          ))}
          {filteredBytes.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-headline-xl-mobile font-bold text-on-surface tracking-tight">No Match Found</h3>
              <p className="text-on-surface-variant text-label-xs font-bold tracking-wider mt-1">Try relaxing your search terms or changing major filter.</p>
            </div>
          )}
        </div>
      ) : !currentSubject ? (
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
                className="card-hover p-5 flex items-center gap-4 relative overflow-hidden text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-label-sm font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors">
                    {course}
                  </h3>
                  <p className="text-label-xs text-on-surface-variant font-bold tracking-wider mt-1">
                    {count} {count === 1 ? 'Byte' : 'Bytes'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : !currentSubTopic ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subTopics.map((sub) => {
            const count = subTopicCounts[sub] || 0;
            return (
              <button
                key={sub}
                onClick={() => { setCurrentSubTopic(sub); }}
                className="card-hover p-5 flex items-center gap-4 relative overflow-hidden text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-label-sm font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors">
                    {sub}
                  </h3>
                  <p className="text-label-xs text-on-surface-variant font-bold tracking-wider mt-1">
                    {count} {count === 1 ? 'Byte' : 'Bytes'}
                  </p>
                </div>
              </button>
            );
          })}
          {subTopics.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <div className="text-3xl mb-4 text-primary">📂</div>
              <h3 className="text-label-sm font-bold text-on-surface-variant tracking-wider">Empty Folder</h3>
              <p className="text-on-surface-variant text-label-xs font-bold mt-1 tracking-wider">There are no sub-topics created in this course yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBytes.map((byte) => (
            <ByteCard key={byte.id} byte={byte} onDelete={handleDelete} deleteConfirm={deleteConfirm} getTopicColor={getTopicColor} />
          ))}
          {filteredBytes.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <div className="text-3xl mb-4 text-primary">⚡</div>
              <h3 className="text-label-sm font-bold text-on-surface-variant tracking-wider">No Bytes</h3>
              <p className="text-on-surface-variant text-label-xs font-bold mt-1 tracking-wider">No bytes in this sub-topic matching your filter.</p>
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
    <div className="relative card p-4 flex flex-col h-full min-h-[180px] group hover:border-primary-fixed-dim transition-all duration-300">
      <Link href={`/bytes/view?id=${byte.id}`} className="flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`badge ${getTopicColor(byte.topic)} text-label-xs font-bold tracking-wider`}>
            {byte.topic}
          </span>
          {byte.sub_topic && (
            <span className="badge bg-surface-container border border-outline-variant text-on-surface-variant text-label-xs font-bold tracking-wider">
              {byte.sub_topic}
            </span>
          )}
          {byte.major && byte.major !== 'Both' && (
            <span className="badge bg-primary-container text-on-primary-container text-label-xs font-bold tracking-wider">
              {byte.major}
            </span>
          )}
        </div>
        
        <h3 className="text-label-sm font-bold text-on-surface mb-1.5 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {byte.title}
        </h3>
        
        <p className="text-label-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-3 flex-1">
          {byte.content}
        </p>
        
        <div className="mt-auto pt-3 border-t border-outline-variant flex items-center justify-between text-label-xs font-bold tracking-wider text-on-surface-variant">
          <div className="flex gap-2">
            {byte.relatedQuestionIds && byte.relatedQuestionIds.length > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <HelpCircle className="w-3 h-3" />
                {byte.relatedQuestionIds.length} Qs
              </span>
            )}
            {byte.images && byte.images.length > 0 && (
              <span className="flex items-center gap-1" title="Contains visual assets">
                <Image className="w-3 h-3" />
                Media
              </span>
            )}
          </div>
          <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-label-xs">
            Read
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
      
      {byte.source !== 'system' && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => onDelete(byte.id, e)}
            title={deleteConfirm === byte.id ? 'Click again to confirm delete' : 'Delete byte'}
            className={`w-6 h-6 rounded-lg bg-surface border flex items-center justify-center transition-all ${
              deleteConfirm === byte.id
                ? 'border-error/60 bg-error-container/20'
                : 'border-outline-variant hover:border-error/50 hover:bg-error-container/10'
            }`}
          >
            <Trash2 className={`w-3 h-3 ${deleteConfirm === byte.id ? 'text-error' : 'text-on-surface-variant group-hover:text-error'}`} />
          </button>
        </div>
      )}
    </div>
  );
}
