'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, FileText, ChevronLeft, ChevronRight, X, Download, ZoomIn } from 'lucide-react';

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
      <div className="fixed inset-0 z-[100] bg-surface flex flex-col animate-in fade-in">
        {/* Viewer Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-surface border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setViewingDoc(null)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-lg hover:bg-surface-container-low shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-label-xs font-bold tracking-wider hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-6 bg-outline-variant hidden sm:block" />
            <div className="min-w-0">
              <h2 className="text-label-sm font-bold text-on-surface truncate">{viewingDoc.title}</h2>
              <p className="text-label-xs text-on-surface-variant font-bold tracking-wider truncate">{viewingDoc.topic}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={viewingDoc.file_url}
              download={viewingDoc.file_name}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-container text-on-primary-container hover:brightness-110 transition-all text-label-xs font-bold tracking-wider"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              onClick={() => setViewingDoc(null)}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Embed */}
        <div className="flex-1 bg-surface-dim">
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
    <div className="max-w-6xl mx-auto space-y-8 py-4 pb-20">
      {/* Header */}
      <div className="card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-container/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <span className="text-label-xs text-primary font-bold tracking-wider mb-3 block">
            Study Resources
          </span>
          <h1 className="text-headline-2xl sm:text-headline-3xl font-bold text-on-surface mb-2 tracking-tight">
            PDF <span className="text-gradient">Documents</span>
          </h1>
          <p className="text-body-base text-on-surface-variant max-w-lg leading-relaxed">
            Access course materials, past exams, and study guides uploaded by instructors. Read them directly in your browser.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
            placeholder="Search documents..."
          />
        </div>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="all">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="all">All Majors</option>
          <option value="CSE">CSE</option>
          <option value="Software">Software</option>
          <option value="Both">Both</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-label-xs text-on-surface-variant font-bold tracking-wider">
        {filtered.length} document{filtered.length !== 1 ? 's' : ''} available
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-surface-container-highest rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-on-surface-variant" />
          </div>
          <p className="text-label-sm text-on-surface-variant font-bold tracking-wider">No documents found</p>
          <p className="text-label-xs text-on-surface-variant mt-2">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setViewingDoc(doc)}
              className="card p-5 text-left flex flex-col gap-3 group hover:border-primary-fixed-dim transition-all relative overflow-hidden"
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-label-sm font-bold text-on-surface leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                    {doc.title}
                  </p>
                  <p className="text-label-xs text-on-surface-variant font-bold tracking-wider mt-1">
                    {doc.topic}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 relative z-10">
                <span className="text-label-xs px-2 py-1 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant font-bold">
                  {doc.major || 'Both'}
                </span>
                <span className="text-label-xs px-2 py-1 rounded-full bg-primary-container/30 text-primary border border-primary/20 font-bold">
                  PDF
                </span>
                <span className="text-label-xs text-on-surface-variant font-bold ml-auto">
                  {formatFileSize(doc.file_size)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant mt-1 relative z-10">
                <span className="text-label-xs text-on-surface-variant">
                  {formatDate(doc.created_at)}
                </span>
                <span className="text-label-xs font-bold tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Read Now
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
