'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Document {
  id: string;
  title: string;
  topic: string;
  major: 'CSE' | 'Software' | 'Both';
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedMajor, setSelectedMajor] = useState('all');
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
      } else {
        setDocuments(data || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }

  const topics = useMemo(() => {
    const topicSet = new Set(documents.map((d) => d.topic));
    return Array.from(topicSet).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedTopic !== 'all' && doc.topic !== selectedTopic) return false;
      if (selectedMajor !== 'all' && doc.major !== selectedMajor && doc.major !== 'Both') return false;
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(sq) ||
          doc.topic.toLowerCase().includes(sq) ||
          doc.file_name.toLowerCase().includes(sq)
        );
      }
      return true;
    });
  }, [documents, selectedTopic, selectedMajor, searchQuery]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Full-screen PDF viewer
  if (viewingDoc) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0b1e] flex flex-col animate-in fade-in">
        {/* Viewer Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#11152a] border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setViewingDoc(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm truncate">{viewingDoc.title}</h2>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest truncate">{viewingDoc.topic}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={viewingDoc.file_url}
              download={viewingDoc.file_name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-colors text-xs font-black uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              onClick={() => setViewingDoc(null)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Embed */}
        <div className="flex-1 bg-gray-900">
          <iframe
            src={`${viewingDoc.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={viewingDoc.title}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#11152a] p-5 sm:p-8 border border-accent-purple/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-accent-purple-glow mb-4 block">
            Study Resources
          </span>
          <h1 className="text-2xl sm:text-5xl font-black text-white mb-3 italic tracking-tighter">
            PDF <span className="text-accent-purple-glow">DOCUMENTS</span>
          </h1>
          <p className="text-gray-400 max-w-lg leading-relaxed text-xs sm:text-sm">
            Access course materials, past exams, and study guides uploaded by instructors. Read them directly in your browser.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="modern-input flex-1"
          placeholder="Search documents..."
        />
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="modern-input sm:w-48"
        >
          <option value="all">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
          className="modern-input sm:w-48"
        >
          <option value="all">All Majors</option>
          <option value="CSE">CSE</option>
          <option value="Software">Software</option>
          <option value="Both">Both</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        {filtered.length} document{filtered.length !== 1 ? 's' : ''} available
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-dark-700 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0v3.375m0-3.375l3 3.375m-3-3.375l-3 3.375M5.625 21h12.75c.621 0 1.125-.504 1.125-1.125V8.25a.75.75 0 00-.22-.53l-5.25-5.25a.75.75 0 00-.53-.22H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No documents found</p>
          <p className="text-gray-600 text-xs mt-2">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setViewingDoc(doc)}
              className="glass-card p-5 text-left flex flex-col gap-3 group hover:border-accent-purple/40 hover:shadow-lg hover:shadow-purple-500/5 transition-all border-white/5 relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/0 group-hover:bg-accent-purple/10 rounded-full blur-[40px] transition-all -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-accent-purple-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold leading-relaxed line-clamp-2 group-hover:text-accent-purple-light transition-colors">
                    {doc.title}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">
                    {doc.topic}
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex flex-wrap items-center gap-2 mt-auto pt-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-dark-500 text-gray-400 font-bold uppercase">
                  {doc.major || 'Both'}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-accent-purple/10 text-accent-purple-glow border border-accent-purple/20 font-bold uppercase">
                  PDF
                </span>
                <span className="text-[10px] text-gray-600 font-bold ml-auto">
                  {formatFileSize(doc.file_size)}
                </span>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                <span className="text-[10px] text-gray-600">
                  {formatDate(doc.created_at)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent-purple opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Read Now
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
