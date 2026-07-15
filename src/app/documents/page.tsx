'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, FileText, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';

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
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-headline-2xl font-bold text-on-surface">PDF Documents</h1>
        <p className="text-body-base text-on-surface-variant mt-1">
          {filtered.length} document{filtered.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
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
          className="input-field w-fit min-w-[140px]"
        >
          <option value="all">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
          className="input-field w-fit min-w-[130px]"
        >
          <option value="all">All Majors</option>
          <option value="CSE">CSE</option>
          <option value="Software">Software</option>
          <option value="Both">Both</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card p-4 flex flex-col min-h-[160px]">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-highest rounded w-3/4" />
                  <div className="h-3 bg-surface-container-highest rounded w-1/2" />
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-outline-variant">
                <div className="h-3 bg-surface-container-highest rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-on-surface-variant" />
          </div>
          <h3 className="text-headline-xl-mobile font-semibold text-on-surface mb-2">No documents found</h3>
          <p className="text-on-surface-variant">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setViewingDoc(doc)}
              className="card p-5 text-left flex flex-col min-h-[160px] group transition-all"
            >
              <div className="mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary-container/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h3 className="text-body-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                {doc.title}
              </h3>
              <p className="text-label-sm text-on-surface-variant line-clamp-1">{doc.topic}</p>

              <div className="mt-auto pt-3 border-t border-outline-variant flex items-center justify-between text-label-sm font-bold tracking-wider text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span className="text-on-surface-variant/30">·</span>
                  <span>{formatDate(doc.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium">
                    {doc.major || 'Both'}
                  </span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Open
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
