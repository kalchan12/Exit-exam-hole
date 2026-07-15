'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/lib/rbac';
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

type Tab = 'upload' | 'list';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('upload');

  // Upload state
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [major, setMajor] = useState<'CSE' | 'Software' | 'Both'>('Both');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // List state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Admin guard
  useEffect(() => {
    if (!authLoading && !isAdmin(profile?.username)) {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, router]);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
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
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        setFile(null);
        return;
      }
      if (selected.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !topic) {
      setError('Please fill in all fields and select a PDF file.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setError('');

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
      const filePath = `pdfs/${fileName}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      setUploadProgress(60);

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setUploadProgress(80);

      // 3. Insert metadata into documents table
      const { error: insertError } = await supabase.from('documents').insert({
        title,
        topic,
        major,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
      });

      if (insertError) throw new Error(`Failed to save metadata: ${insertError.message}`);

      setUploadProgress(100);
      setSuccess(`"${title}" uploaded successfully!`);

      // Reset form
      setTitle('');
      setTopic('');
      setMajor('Both');
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setTimeout(async () => {
        setSuccess('');
        setUploadProgress(0);
        await loadDocuments();
        setTab('list');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    try {
      // Extract storage path from the URL
      const urlParts = doc.file_url.split('/documents/');
      const storagePath = urlParts[urlParts.length - 1];

      // Delete from storage
      if (storagePath) {
        await supabase.storage.from('documents').remove([storagePath]);
      }

      // Delete from database
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;

      setSuccess('Document deleted successfully.');
      setTimeout(() => {
        setSuccess('');
        loadDocuments();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = documents.filter((doc) => {
    if (!searchQuery) return true;
    const sq = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(sq) ||
      doc.topic.toLowerCase().includes(sq) ||
      doc.file_name.toLowerCase().includes(sq)
    );
  });

  if (authLoading) {
    return <div className="text-gray-500 text-center py-20">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-20">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">
            Document Manager
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest">
            {tab === 'upload'
              ? 'Upload PDF documents for students'
              : `${documents.length} documents in storage`}
          </p>
        </div>
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'upload'
                ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'list'
                ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            View All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-bold">
          {success}
        </div>
      )}

      {/* UPLOAD TAB */}
      {tab === 'upload' && (
        <div className="glass-card p-6 sm:p-10 border-white/5 animate-in fade-in zoom-in-95">
          <form onSubmit={handleUpload} className="space-y-8">
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                  Major Focus
                </label>
                <select
                  value={major}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMajor(e.target.value as any)}
                  className="modern-input w-full"
                >
                  <option value="Both">Both CSE & Software</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="Software">Software Engineering</option>
                </select>
              </div>

              <div className="space-y-1 flex-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                  Topic / Subject <span className="text-accent-purple">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="modern-input w-full"
                  placeholder="E.g. Database Systems"
                />
              </div>

              <div className="space-y-1 flex-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                  Document Title <span className="text-accent-purple">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="modern-input w-full"
                  placeholder="E.g. SQL Fundamentals Guide"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                PDF File <span className="text-accent-purple">*</span>
              </label>
              <div className="relative">
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="pdf-file-input"
                  className="flex flex-col items-center justify-center w-full min-h-[200px] rounded-2xl border-2 border-dashed border-white/10 hover:border-accent-purple/40 bg-black/20 cursor-pointer transition-all group"
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-3 p-6">
                      <div className="w-16 h-16 rounded-2xl bg-accent-purple/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-accent-purple-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">{file.name}</p>
                        <p className="text-gray-500 text-xs mt-1">{formatFileSize(file.size)}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent-purple">
                        Click to change file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 p-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 group-hover:bg-accent-purple/20 flex items-center justify-center transition-colors">
                        <svg className="w-8 h-8 text-gray-500 group-hover:text-accent-purple transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">Drop your PDF here or click to browse</p>
                        <p className="text-gray-500 text-xs mt-1">Maximum file size: 50MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="font-black uppercase tracking-widest">Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn-primary w-full py-4 text-sm font-black uppercase italic tracking-widest disabled:opacity-50 mt-6 shadow-xl shadow-purple-500/20"
            >
              {uploading ? 'Uploading Document...' : 'Upload PDF Document'}
            </button>
          </form>
        </div>
      )}

      {/* LIST TAB */}
      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="modern-input w-full max-w-xl"
              placeholder="Search by title, topic, or filename..."
            />
          </div>

          {loadingDocs ? (
            <div className="text-gray-500 text-center py-20 text-xs font-bold uppercase tracking-widest">
              Loading documents...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  className="glass-card p-5 flex flex-col gap-3 group hover:border-accent-purple/40 hover:shadow-lg transition-all border-white/5 relative overflow-hidden"
                >
                  {/* PDF Icon */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-accent-purple-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-bold leading-relaxed truncate">{doc.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{doc.topic}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
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

                  {/* Actions */}
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-colors"
                    >
                      Open PDF
                    </a>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-gray-600 font-bold uppercase tracking-widest py-20 text-xs">
                  No documents found.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
