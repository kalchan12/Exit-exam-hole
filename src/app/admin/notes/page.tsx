'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/components/AuthProvider';
import {
  getNotes, getCourses, saveCustomCourse, invalidateNotesCache,
  type Note, saveCustomNote, deleteCustomNote
} from '@/lib/dataLoader';

type Tab = 'add' | 'list';
type Major = 'CSE' | 'Software' | 'Both';

export default function AdminNotesPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('add');
  const [step, setStep] = useState<1 | 2>(1);

  const [major, setMajor] = useState<Major>('Both');
  const [title, setTitle] = useState('');
  const [courses, setCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && profile?.username !== 'psycho') {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, router]);

  const loadData = useCallback(async () => {
    invalidateNotesCache();
    const [fetchedNotes, fetchedCourses] = await Promise.all([getNotes(), getCourses()]);
    setNotes(fetchedNotes);
    setCourses(fetchedCourses);
    if (fetchedCourses.length > 0) {
      setSelectedCourse(prev => prev || fetchedCourses[0]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCourses = useMemo(() => {
    if (!courseSearchQuery) return courses;
    return courses.filter(c => c.toLowerCase().includes(courseSearchQuery.toLowerCase()));
  }, [courses, courseSearchQuery]);

  const resetFlow = () => {
    setStep(1);
    setError('');
    setSuccess('');
    setFetchedData(null);
    setGithubUrl('');
    setTitle('');
    setIsAddingCourse(false);
    setIsFetching(false);
  };

  const handleGitHubFetch = async () => {
    if (!githubUrl || !title || !selectedCourse) {
      setError('Please provide a URL, Course, and Title first.');
      return;
    }
    setIsFetching(true);
    setError('');
    try {
      const { fetchGitHubNote } = await import('@/lib/githubFetcher');
      const noteResult = await fetchGitHubNote(githubUrl, title);
      setFetchedData(noteResult);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch from GitHub');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    const name = newCourseName.trim();
    saveCustomCourse(name);

    try {
      const { saveCourseToLocalFile } = await import('@/app/admin/actions');
      await saveCourseToLocalFile(name);

      const { saveCourseToSupabase } = await import('@/lib/supabaseLoader');
      await saveCourseToSupabase(name);
    } catch (e) {
      console.warn('Bypassed course remote database save:', e);
    }

    setCourses(prev => [...prev.filter(c => c !== name), name].sort());
    setSelectedCourse(name);
    setNewCourseName('');
    setIsAddingCourse(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsFetching(true);

    try {
      if (!fetchedData) throw new Error('Please fetch content from GitHub first.');

      const noteItem: Note = {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        topic: selectedCourse,
        title: title,
        body: fetchedData.body || fetchedData.content || '',
        source: 'GitHub',
        label: 'Course Material',
        major: major,
        githubUrl: githubUrl,
        date: new Date().toISOString()
      };

      saveCustomNote(noteItem);

      const { saveNoteToLocalFile } = await import('@/app/admin/actions');
      const localResult = await saveNoteToLocalFile(noteItem);
      if (!localResult.success) {
        throw new Error(localResult.error || 'Failed to save note locally.');
      }

      if (user) {
        try {
          const { saveNoteToSupabase } = await import('@/lib/supabaseLoader');
          await saveNoteToSupabase(noteItem, user.id);
        } catch (dbErr) {
          console.warn('Supabase database sync bypassed:', dbErr);
        }
      }

      setSuccess('Note synchronized successfully!');
      setTimeout(async () => {
        await loadData();
        resetFlow();
        setTab('list');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to save data. Check console.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this note?')) return;

    try {
      deleteCustomNote(id);

      const { deleteNoteFromLocalFile } = await import('@/app/admin/actions');
      await deleteNoteFromLocalFile(id);

      try {
        const { supabase } = await import('@/lib/supabaseClient');
        await supabase.from('notes').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('Bypassed DB deletion:', dbErr);
      }

      setSuccess('Note removed successfully.');
      setTimeout(() => {
        setSuccess('');
        loadData();
      }, 1500);
    } catch (err) {
      setError('Failed to fully remove this note.');
    }
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const sq = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(sq) || n.topic.toLowerCase().includes(sq)
    );
  }, [notes, searchQuery]);

  if (authLoading) return <div className="text-gray-500 text-center py-20">Loading...</div>;

  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(n => {
      counts[n.topic] = (counts[n.topic] || 0) + 1;
    });
    return counts;
  }, [notes]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">Note Manager</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest">
            {tab === 'add'
              ? step === 1
                ? 'Step 1: Choose a Course'
                : `Step 2: Add Note to ${selectedCourse}`
              : `${notes.length} notes in database`
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setTab('add'); resetFlow(); }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                tab === 'add' ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Add Note
            </button>
            <button
              onClick={() => setTab('list')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                tab === 'list' ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              View Notes
            </button>
          </div>
          {tab === 'add' && step > 1 && (
            <button
              type="button"
              onClick={resetFlow}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider text-accent-purple hover:text-white border border-accent-purple/20 hover:border-white/20 rounded-xl transition-all"
            >
              ← Back to Courses
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold animate-in fade-in">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-bold animate-in fade-in">{success}</div>}

      {/* TAB: ADD */}
      {tab === 'add' && (
        <div className="space-y-6">
          {/* Step 1: Course Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="glass-card p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Select Course</h3>
                  <p className="text-gray-500 text-xs uppercase font-semibold">Choose which course this note belongs to.</p>
                </div>
                <div className="w-full md:w-80 relative">
                  <input
                    type="text"
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    placeholder="Filter courses..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:border-accent-purple focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCourses.map((course) => {
                  const count = noteCounts[course] || 0;
                  return (
                    <button
                      key={course}
                      onClick={() => { setSelectedCourse(course); setStep(2); }}
                      className="group text-left p-5 rounded-2xl border border-white/5 bg-black/20 hover:border-accent-purple/40 hover:bg-[#11152a] hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg className="w-6 h-6 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-bold text-xs truncate leading-tight group-hover:text-accent-purple-light transition-colors">
                          {course}
                        </h3>
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-wider mt-1">
                          {count} {count === 1 ? 'Note' : 'Notes'}
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 w-20 h-20 blur-[30px] opacity-0 group-hover:opacity-10 bg-accent-purple transition-opacity pointer-events-none" />
                    </button>
                  );
                })}

                {/* Inline Course Creator */}
                <div className="p-5 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-center min-h-[82px]">
                  {isAddingCourse ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleAddCourse(); }} className="space-y-2 w-full">
                      <input
                        type="text"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="New course name..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent-purple focus:outline-none"
                        required
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsAddingCourse(false)}
                          className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-accent-purple hover:bg-accent-purple-glow text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsAddingCourse(true)}
                      className="w-full h-full flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <span className="text-xl">+</span>
                      <span className="text-xs font-black uppercase tracking-widest">New Course</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Note Form */}
          {step === 2 && (
            <div className="glass-card p-6 sm:p-10 border-white/5 bg-black/40 animate-in fade-in zoom-in-95 duration-300 space-y-6">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 bg-black/40 p-4 rounded-xl border border-white/5">
                <span className="text-gray-500">Course:</span>
                <span className="text-accent-purple">{selectedCourse}</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-[10px] text-gray-500 hover:text-white border border-white/10 hover:border-white/30 rounded px-2 py-0.5"
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Title <span className="text-accent-purple">*</span></label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="E.g. Normalization in Database Design"
                      className="modern-input w-full"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Major Focus</label>
                    <select
                      value={major}
                      onChange={(e: any) => setMajor(e.target.value)}
                      className="modern-input w-full cursor-pointer"
                    >
                      <option value="Both">Both CSE & Software</option>
                      <option value="CSE">Computer Science (CSE)</option>
                      <option value="Software">Software Engineering</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">GitHub Raw URL (.md) <span className="text-accent-purple">*</span></label>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/.../note.md"
                      className="modern-input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-end gap-4">
                  <button
                    type="button"
                    onClick={handleGitHubFetch}
                    disabled={isFetching}
                    className="btn-secondary px-8 py-[18px] font-black uppercase text-xs italic"
                  >
                    {isFetching ? 'Fetching...' : 'Fetch & Preview'}
                  </button>
                </div>

                {fetchedData && (
                  <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4 animate-in fade-in">
                    <h4 className="text-accent-purple font-black uppercase text-[10px]">Markdown Preview</h4>
                    <div className="max-h-60 overflow-y-auto text-xs text-gray-400 space-y-2 prose prose-invert prose-purple">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{fetchedData.body || fetchedData.content || ''}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isFetching || !fetchedData}
                  className="btn-primary w-full py-4 text-sm font-black uppercase italic tracking-widest disabled:opacity-50 shadow-xl shadow-purple-500/20"
                >
                  {isFetching ? 'Saving...' : 'Publish Note'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB: LIST */}
      {tab === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex gap-4 items-center mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="modern-input w-full max-w-xl"
              placeholder="Search by title or course..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="glass-card p-5 flex flex-col gap-3 group hover:border-accent-purple/40 hover:shadow-lg transition-all border-white/5 relative overflow-hidden bg-black/20">
                <div className="absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-400 rounded-bl-xl border-l border-b border-white/5">
                  {note.label || 'Note'}
                </div>
                <div className="min-w-0 pr-16">
                  <p className="text-white text-sm font-bold leading-relaxed truncate">{note.title}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{note.topic}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-dark-500 text-gray-400 font-bold uppercase">{note.major || 'Both'}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">{note.source}</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-center transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="col-span-full text-center text-gray-600 font-bold uppercase tracking-widest py-20 text-xs">No notes found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
