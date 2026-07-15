'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/lib/rbac';
import FolderCard from '@/components/admin/FolderCard';
import InlineCreator from '@/components/admin/InlineCreator';
import BytePreview from '@/components/admin/BytePreview';
import ByteConfigForm from '@/components/admin/ByteConfigForm';
import { 
  getBytes, 
  getCourses, 
  saveCustomCourse, 
  invalidateBytesCache, 
  type Byte, 
  saveCustomByte, 
  deleteCustomByte 
} from '@/lib/dataLoader';

type Tab = 'add' | 'list';
type Major = 'CSE' | 'Software' | 'Both';
type SourceType = 'github' | 'video' | 'manual';

export default function AdminBytesPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('add');

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [subTopic, setSubTopic] = useState('');
  const [title, setTitle] = useState('');
  const [major, setMajor] = useState<Major>('Both');
  const [sourceType, setSourceType] = useState<SourceType>('github');
  
  // Content values
  const [githubUrl, setGithubUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [manualContent, setManualContent] = useState('');

  // Course Folders & Bytes Data
  const [courses, setCourses] = useState<string[]>([]);
  const [bytes, setBytes] = useState<Byte[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // UI State
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<Partial<Byte> | null>(null);

  // List search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');

  // Editing state variables
  const [editingByteId, setEditingByteId] = useState<string | null>(null);
  const [originalDate, setOriginalDate] = useState<string>('');
  const [originalRelatedQuestionIds, setOriginalRelatedQuestionIds] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [refreshingByteId, setRefreshingByteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin(profile?.username)) {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, router]);

  const loadData = useCallback(async () => {
    invalidateBytesCache();
    const [fetchedBytes, fetchedCourses] = await Promise.all([getBytes(), getCourses()]);
    setBytes(fetchedBytes);
    setCourses(fetchedCourses);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute counts for folder display
  const courseFolderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bytes.forEach(b => {
      counts[b.topic] = (counts[b.topic] || 0) + 1;
    });
    return counts;
  }, [bytes]);

  // Compute unique existing sub-topics for selected course
  const existingSubTopics = useMemo(() => {
    if (!selectedCourse) return [];
    const filtered = bytes.filter(b => b.topic === selectedCourse);
    const subtopics = Array.from(new Set(filtered.map(b => b.sub_topic).filter((s): s is string => !!s)));
    return subtopics.sort();
  }, [bytes, selectedCourse]);

  // Filter courses by search
  const filteredCourses = useMemo(() => {
    return courses.filter(c => c.toLowerCase().includes(courseSearchQuery.toLowerCase()));
  }, [courses, courseSearchQuery]);

  const resetWizard = () => {
    setStep(1);
    setSelectedCourse('');
    setSubTopic('');
    setTitle('');
    setMajor('Both');
    setSourceType('github');
    setGithubUrl('');
    setVideoUrl('');
    setManualContent('');
    setPreviewData(null);
    setError('');
    setSuccess('');
    setIsAddingCourse(false);
    setNewCourseName('');
    setEditingByteId(null);
    setOriginalDate('');
    setOriginalRelatedQuestionIds([]);
    setVideoUrls([]);
    setNewVideoUrl('');
  };

  const handleCreateCourseFolder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newCourseName.trim();
    if (!name) return;
    
    setIsFetching(true);
    setError('');
    try {
      saveCustomCourse(name);
      
      // Save locally first
      const { saveCourseToLocalFile } = await import('@/app/admin/actions');
      await saveCourseToLocalFile(name);
      
      // Try Supabase but don't fail if it fails
      try {
        const { saveCourseToSupabase } = await import('@/lib/supabaseLoader');
        await saveCourseToSupabase(name);
      } catch (dbErr) {
        console.warn('Database course save bypassed:', dbErr);
      }
      
      setCourses(prev => [...prev.filter(c => c !== name), name].sort());
      setSelectedCourse(name);
      setStep(2);
      
      setNewCourseName('');
      setIsAddingCourse(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create new course folder.');
    } finally {
      setIsFetching(false);
    }
  };

  const normalizeVideoUrl = (url: string): string => {
    let normalized = url.trim();
    if (!normalized) return '';
    if (normalized.includes('youtube.com/watch?v=')) {
      const videoId = new URL(normalized).searchParams.get('v');
      if (videoId) {
        normalized = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (normalized.includes('youtu.be/')) {
      const parts = normalized.split('/');
      const videoId = parts[parts.length - 1].split('?')[0];
      if (videoId) {
        normalized = `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return normalized;
  };

  const handleAddVideoUrl = () => {
    if (!newVideoUrl.trim()) return;
    const normalized = normalizeVideoUrl(newVideoUrl);
    if (!normalized) {
      setError('Please enter a valid YouTube or video URL.');
      return;
    }
    if (videoUrls.includes(normalized)) {
      setError('This video is already in the list.');
      return;
    }
    setError('');
    setVideoUrls(prev => [...prev, normalized]);
    setNewVideoUrl('');
  };

  const handleVerifyAndPreview = async () => {
    setError('');
    
    if (!title.trim()) {
      setError('Please provide a specific title for this byte.');
      return;
    }

    // Accumulate all video links
    const finalVideoUrls = [...videoUrls];
    const typedVideo = normalizeVideoUrl(newVideoUrl || videoUrl);
    if (typedVideo && !finalVideoUrls.includes(typedVideo)) {
      finalVideoUrls.push(typedVideo);
    }

    if (sourceType === 'github') {
      if (!githubUrl.trim()) {
        setError('Please enter a GitHub Raw URL.');
        return;
      }
      setIsFetching(true);
      try {
        const { fetchGitHubByte } = await import('@/lib/githubFetcher');
        const result = await fetchGitHubByte(githubUrl, selectedCourse);
        
        setPreviewData({
          title,
          topic: selectedCourse,
          sub_topic: subTopic.trim() || 'General',
          content: result.content,
          images: result.images,
          source: 'GitHub',
          githubUrl: githubUrl,
          videoUrl: finalVideoUrls[0] || undefined,
          videoUrls: finalVideoUrls,
          major: major,
          date: originalDate || new Date().toISOString()
        });
        setStep(3);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content from the provided GitHub link. Verify if it is a raw link.');
      } finally {
        setIsFetching(false);
      }
    } else if (sourceType === 'video') {
      if (finalVideoUrls.length === 0) {
        setError('Please enter a valid Video URL.');
        return;
      }

      setPreviewData({
        title,
        topic: selectedCourse,
        sub_topic: subTopic.trim() || 'General',
        content: `### Video Lesson: ${title}\nWatch the attached video resource below to learn about this subtopic.`,
        videoUrl: finalVideoUrls[0],
        videoUrls: finalVideoUrls,
        source: 'Local',
        major: major,
        date: originalDate || new Date().toISOString()
      });
      setStep(3);
    } else {
      if (!manualContent.trim()) {
        setError('Please enter some markdown content.');
        return;
      }
      setPreviewData({
        title,
        topic: selectedCourse,
        sub_topic: subTopic.trim() || 'General',
        content: manualContent,
        videoUrl: finalVideoUrls[0] || undefined,
        videoUrls: finalVideoUrls,
        source: 'Local',
        major: major,
        date: originalDate || new Date().toISOString()
      });
      setStep(3);
    }
  };

  const handlePublish = async () => {
    if (!previewData) return;
    setIsFetching(true);
    setError('');
    
    try {
      const byteItem: Byte = {
        id: editingByteId || `byte_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        topic: selectedCourse,
        sub_topic: previewData.sub_topic || 'General',
        title: previewData.title || title,
        content: previewData.content || '',
        images: previewData.images || [],
        videoUrl: previewData.videoUrls?.[0] || previewData.videoUrl || undefined,
        videoUrls: previewData.videoUrls || [],
        source: previewData.githubUrl ? 'GitHub' : 'Local',
        major: major,
        githubUrl: previewData.githubUrl,
        relatedQuestionIds: originalRelatedQuestionIds,
        date: previewData.date || new Date().toISOString()
      };

      // 1. Save to local storage cache
      saveCustomByte(byteItem);

      // 2. Save to local JSON file
      const { saveByteToLocalFile } = await import('@/app/admin/actions');
      const localResult = await saveByteToLocalFile(byteItem);
      if (!localResult.success) {
        throw new Error(localResult.error || 'Failed to save byte locally.');
      }

      // 3. Try to save to Supabase optionally
      if (user) {
        try {
          const { saveByteToSupabase } = await import('@/lib/supabaseLoader');
          await saveByteToSupabase(byteItem, user.id);
        } catch (dbErr) {
          console.warn('Database sync bypassed:', dbErr);
        }
      }

      setSuccess(editingByteId ? 'Byte successfully updated!' : 'Byte successfully saved and synchronized!');
      setTimeout(async () => {
        await loadData();
        resetWizard();
        setTab('list');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save byte content.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this byte? This action is permanent.')) return;
    
    setError('');
    setSuccess('');
    try {
      // 1. Delete from local storage cache
      deleteCustomByte(id);

      // 2. Delete from local JSON file
      const { deleteByteFromLocalFile } = await import('@/app/admin/actions');
      const localResult = await deleteByteFromLocalFile(id);
      if (!localResult.success) {
        throw new Error(localResult.error || 'Failed to delete byte locally.');
      }

      // 3. Try deleting from Supabase optionally
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        await supabase.from('bytes').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('Database deletion bypassed:', dbErr);
      }
      
      setSuccess('Byte deleted successfully.');
      loadData();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete byte.');
    }
  };

  const handleStartEdit = (byte: Byte) => {
    setError('');
    setSuccess('');
    setEditingByteId(byte.id);
    setSelectedCourse(byte.topic);
    setSubTopic(byte.sub_topic || '');
    setTitle(byte.title);
    setMajor(byte.major || 'Both');
    setOriginalDate(byte.date || '');
    setOriginalRelatedQuestionIds(byte.relatedQuestionIds || []);
    
    const initialVideoUrls = byte.videoUrls || (byte.videoUrl ? [byte.videoUrl] : []);
    setVideoUrls(initialVideoUrls);
    setVideoUrl(''); // Clear input box
    
    // Determine source type
    if (byte.githubUrl) {
      setSourceType('github');
      setGithubUrl(byte.githubUrl);
      setManualContent('');
    } else if (byte.videoUrl) {
      // If video URL exists but no githubUrl, check if it has manual content or is a simple video lesson
      const boilerplate = `### Video Lesson: ${byte.title}\nWatch the attached video resource below to learn about this subtopic.`;
      const isBoilerplate = byte.content?.trim() === boilerplate.trim() || byte.content?.includes('Watch the attached video resource below');
      
      if (isBoilerplate) {
        setSourceType('video');
        setGithubUrl('');
        setManualContent('');
      } else {
        setSourceType('manual');
        setGithubUrl('');
        setManualContent(byte.content || '');
      }
    } else {
      setSourceType('manual');
      setGithubUrl('');
      setManualContent(byte.content || '');
    }
    
    setStep(2);
    setTab('add');
  };

  const handleRefreshGitHubContent = async (byte: Byte) => {
    if (!byte.githubUrl) return;
    setError('');
    setSuccess('');
    setRefreshingByteId(byte.id);

    try {
      const { fetchGitHubByte } = await import('@/lib/githubFetcher');
      const result = await fetchGitHubByte(byte.githubUrl, byte.topic);
      
      const updatedByte: Byte = {
        ...byte,
        content: result.content,
        images: result.images || []
      };

      // 1. Save to local storage cache
      saveCustomByte(updatedByte);

      // 2. Save to local JSON file
      const { saveByteToLocalFile } = await import('@/app/admin/actions');
      const localResult = await saveByteToLocalFile(updatedByte);
      if (!localResult.success) {
        throw new Error(localResult.error || 'Failed to save byte locally.');
      }

      // 3. Try to save to Supabase optionally
      if (user) {
        try {
          const { saveByteToSupabase } = await import('@/lib/supabaseLoader');
          await saveByteToSupabase(updatedByte, user.id);
        } catch (dbErr) {
          console.warn('Database sync bypassed:', dbErr);
        }
      }

      setSuccess(`Successfully refreshed content for "${byte.title}" from GitHub!`);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to refresh GitHub content.');
    } finally {
      setRefreshingByteId(null);
    }
  };

  // Filter list of bytes
  const filteredBytes = useMemo(() => {
    return bytes.filter(b => {
      const matchSearch = searchQuery
        ? b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.sub_topic && b.sub_topic.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      const matchCourse = filterCourse !== 'all' ? b.topic === filterCourse : true;
      return matchSearch && matchCourse;
    });
  }, [bytes, searchQuery, filterCourse]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            {editingByteId ? 'Edit Byte' : 'Byte Manager'}
            <span className="badge bg-accent-purple/10 text-accent-purple-glow border border-accent-purple/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 mt-1">Admin</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest">
            {tab === 'add' 
              ? editingByteId 
                ? `Editing Mode — Step ${step} of 3: ${
                    step === 1 ? 'Change Course Folder' : step === 2 ? 'Update Byte details' : 'Preview & Save'
                  }`
                : `Step ${step} of 3: ${
                    step === 1 ? 'Choose Course Folder' : step === 2 ? 'Configure Byte details' : 'Preview & Publish'
                  }`
              : `Manage existing learning bytes (${filteredBytes.length} loaded)`
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setTab('add'); resetWizard(); }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                tab === 'add' ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {editingByteId ? 'Editing Byte' : 'Add Byte'}
            </button>
            <button
              onClick={() => setTab('list')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                tab === 'list' ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              View Bytes List
            </button>
          </div>
          {tab === 'add' && step > 1 && (
            <button 
              type="button" 
              onClick={resetWizard}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider text-accent-purple hover:text-white border border-accent-purple/20 hover:border-white/20 rounded-xl transition-all"
            >
              {editingByteId ? '← Cancel Edit' : '← Restart Flow'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold animate-in fade-in">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-bold animate-in fade-in">{success}</div>}

      {/* TAB: ADD BYTE */}
      {tab === 'add' && (
        <div className="space-y-6">
          {/* Step Timeline Indicator */}
          <div className="flex items-center justify-center max-w-lg mx-auto py-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1 last:flex-none">
                <button
                  disabled={num > step && !selectedCourse}
                  onClick={() => setStep(num)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === num
                      ? 'bg-accent-purple text-white ring-4 ring-accent-purple/20'
                      : step > num
                        ? 'bg-green-500 text-white'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                  }`}
                >
                  {step > num ? '✓' : num}
                </button>
                {num < 3 && (
                  <div className={`h-0.5 flex-1 mx-2 ${step > num ? 'bg-green-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1: CHOOSE COURSE FOLDER */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="glass-card p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Select Course Destination</h3>
                  <p className="text-gray-500 text-xs uppercase font-semibold">Choose which course folder this learning byte will live under.</p>
                </div>
                <div className="w-full md:w-80 relative">
                  <input
                    type="text"
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    placeholder="Filter folders..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:border-accent-purple focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Visual grid of folders */}
                {filteredCourses.map((course) => {
                  const count = courseFolderCounts[course] || 0;
                  return (
                    <FolderCard
                      key={course}
                      name={course}
                      count={count}
                      onClick={() => { setSelectedCourse(course); setStep(2); }}
                    />
                  );
                })}

                {/* Inline Course Creator folder card */}
                <InlineCreator
                  isAdding={isAddingCourse}
                  value={newCourseName}
                  onValueChange={setNewCourseName}
                  onAdd={() => { handleCreateCourseFolder(); }}
                  onCancel={() => setIsAddingCourse(false)}
                  onStart={() => setIsAddingCourse(true)}
                  placeholder="New folder name..."
                  buttonLabel="Create"
                  noun="New Folder"
                />
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE BYTE CONTENT */}
          {step === 2 && (
            <ByteConfigForm
              selectedCourse={selectedCourse}
              title={title}
              subTopic={subTopic}
              major={major}
              sourceType={sourceType}
              githubUrl={githubUrl}
              manualContent={manualContent}
              videoUrls={videoUrls}
              newVideoUrl={newVideoUrl}
              existingSubTopics={existingSubTopics}
              isFetching={isFetching}
              onTitleChange={setTitle}
              onSubTopicChange={setSubTopic}
              onMajorChange={setMajor}
              onSourceTypeChange={setSourceType}
              onGithubUrlChange={setGithubUrl}
              onManualContentChange={setManualContent}
              onNewVideoUrlChange={setNewVideoUrl}
              onAddVideoUrl={handleAddVideoUrl}
              onRemoveVideoUrl={(idx) => setVideoUrls(prev => prev.filter((_, i) => i !== idx))}
              onBack={() => setStep(1)}
              onVerifyAndPreview={handleVerifyAndPreview}
            />
          )}

          {/* STEP 3: PREVIEW & FINAL DESCRIPTION */}
          {step === 3 && previewData && (
            <BytePreview
              previewData={previewData}
              isFetching={isFetching}
              onEdit={() => setStep(2)}
              onPublish={handlePublish}
            />
          )}
        </div>
      )}

      {/* TAB: VIEW BYTES LIST */}
      {tab === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass-card p-4 flex flex-col sm:flex-row flex-wrap gap-4 border-white/5 bg-black/40">
            <div className="flex-1 min-w-[200px] relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bytes..."
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-accent-purple focus:outline-none transition-all font-bold"
              />
            </div>
            <select 
              value={filterCourse} 
              onChange={(e) => setFilterCourse(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-400 font-bold uppercase tracking-wider focus:border-accent-purple focus:outline-none cursor-pointer"
            >
              <option value="all">All Course Folders</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBytes.map((byte) => (
              <div 
                key={byte.id} 
                className="glass-card p-5 flex flex-col justify-between group hover:border-accent-purple/40 hover:shadow-xl transition-all border-white/5 relative overflow-hidden bg-black/20"
              >
                {/* Type Badge */}
                <div className="absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-accent-purple/20 text-accent-purple-glow rounded-bl-xl border-l border-b border-white/5">
                  {byte.githubUrl ? 'GitHub Link' : byte.videoUrl ? 'Video Lesson' : 'Manual Text'}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-accent-purple/30 bg-accent-purple/5 text-accent-purple-glow">
                      {byte.topic}
                    </span>
                    {byte.sub_topic && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-white/5 bg-white/5 text-gray-400">
                        {byte.sub_topic}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 pr-12 group-hover:text-accent-purple-light transition-colors">
                    {byte.title}
                  </h3>

                  <p className="text-gray-500 text-xs line-clamp-3">
                    {byte.content || 'Video resource without text body.'}
                  </p>

                  <div className="flex items-center gap-2 pt-2 text-[9px] font-black uppercase tracking-widest text-gray-600">
                    <span>Major: {byte.major || 'Both'}</span>
                    <span>•</span>
                    <span>{byte.date ? new Date(byte.date).toLocaleDateString() : 'System'}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <button 
                    onClick={() => router.push(`/bytes/view?id=${byte.id}`)}
                    className="text-[10px] font-black uppercase tracking-widest text-accent-purple-light hover:text-white transition-colors"
                  >
                    View Live →
                  </button>
                  
                  <div className="flex gap-2">
                    {byte.githubUrl && (
                      <button 
                        disabled={refreshingByteId === byte.id}
                        onClick={() => handleRefreshGitHubContent(byte)} 
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all opacity-0 group-hover:opacity-100 ${
                          refreshingByteId === byte.id ? 'animate-pulse cursor-not-allowed' : ''
                        }`}
                      >
                        {refreshingByteId === byte.id ? 'Refreshing...' : 'Refresh Content'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleStartEdit(byte)} 
                      className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(byte.id)} 
                      className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredBytes.length === 0 && (
              <div className="col-span-full glass-card p-12 text-center border-white/5 bg-black/20">
                <div className="text-3xl mb-4">📂</div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">No Bytes Found</h3>
                <p className="text-gray-500 text-xs font-bold mt-1 uppercase">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
