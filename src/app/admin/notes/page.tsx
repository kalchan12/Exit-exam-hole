'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/components/AuthProvider';
import { getNotes, getBytes, invalidateNotesCache, invalidateBytesCache, type Note, type Byte, saveCustomNote, saveCustomByte, deleteCustomNote, deleteCustomByte } from '@/lib/dataLoader';

type Tab = 'add' | 'list';
type SubType = 'long_note' | 'short_note' | 'byte' | null;
type Major = 'CSE' | 'Software' | 'Both';

export default function AdminNotesPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('add');

  // Add Wizard State
  const [step, setStep] = useState(1);
  const [subType, setSubType] = useState<SubType>(null);

  // Form Metadata
  const [major, setMajor] = useState<Major>('Both');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  
  // GitHub Content
  const [githubUrl, setGithubUrl] = useState('');
  const [fetchedData, setFetchedData] = useState<any>(null);

  // UI state
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // List state
  const [notes, setNotes] = useState<(Note | Byte)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && profile?.username !== 'psycho') {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, router]);

  const loadData = useCallback(async () => {
    invalidateNotesCache();
    invalidateBytesCache();
    const [fetchedNotes, fetchedBytes] = await Promise.all([getNotes(), getBytes()]);
    // Combine arrays for management list
    const combined = [
        ...fetchedNotes.map(n => ({ ...n, _type: 'note' })), 
        ...fetchedBytes.map(b => ({ ...b, _type: 'byte' }))
    ];
    setNotes(combined);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetFlow = () => {
    setStep(1);
    setSubType(null);
    setError('');
    setSuccess('');
    setFetchedData(null);
    setGithubUrl('');
    setTitle('');
    setTopic('');
    setIsFetching(false);
  };

  const handleGitHubFetch = async () => {
    if (!githubUrl || !title || !topic) {
        setError('Please provide a URL, Topic, and Title first.');
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

  const determineNoteLabel = () => {
    if (subType === 'long_note') return 'Course Material';
    if (subType === 'short_note') return 'Short Note';
    if (subType === 'byte') return 'Learning Byte';
    return 'Short Note';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setIsFetching(true);

    try {
      if (!fetchedData) throw new Error('Please fetch content from GitHub first.');

      if (subType === 'byte') {
          const byteItem: Byte = {
              id: `byte_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              topic: topic,
              title: title,
              content: '', // content stripped, rendered from Github directly
              source: 'GitHub',
              major: major,
              githubUrl: githubUrl,
              date: new Date().toISOString()
          };
          saveCustomByte(byteItem);
      } else {
          const noteItem: Note = {
              id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              topic: topic,
              title: title,
              body: '', // body stripped, rendered from Github directly
              source: 'GitHub',
              label: determineNoteLabel(),
              major: major,
              githubUrl: githubUrl,
              date: new Date().toISOString()
          };
          saveCustomNote(noteItem);
      }

      setSuccess(`Successfully synchronized ${subType?.replace('_', ' ')} with GitHub!`);
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

  const handleDelete = async (id: string, type: 'note' | 'byte') => {
    if (!confirm('Are you sure you want to remove this tracked resource?')) return;
    
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      if (type === 'byte') {
        deleteCustomByte(id);
        await supabase.from('bytes').delete().eq('id', id);
      } else {
        deleteCustomNote(id);
        await supabase.from('notes').delete().eq('id', id);
      }
      
      setSuccess('Resource removed successfully.');
      setTimeout(() => {
        setSuccess('');
        loadData();
      }, 1500);
    } catch (err) {
      setError('Failed to fully remove this resource.');
    }
  };

  // Filtering for list
  const filtered = notes.filter(n => {
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(sq) || n.topic.toLowerCase().includes(sq) || (n as any)._type.toLowerCase().includes(sq);
    }
    return true;
  });

  if (authLoading) return <div className="text-gray-500 text-center py-20">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-20">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">Note Manager</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest">
            {tab === 'add' ? (step === 1 ? 'Step 1: Content Type' : 'Step 2: GitHub Synchronization') : `${notes.length} notes & bytes in database`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                    onClick={() => { setTab('add'); resetFlow(); }}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    tab === 'add' ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Add Study Material
                </button>
                <button
                    onClick={() => setTab('list')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    tab === 'list' ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    View Database
                </button>
            </div>
            {tab === 'add' && step > 1 && (
                <button type="button" onClick={resetFlow} className="text-[10px] font-black uppercase tracking-widest text-accent-purple hover:text-white transition-colors">
                    ← Restart Flow
                </button>
            )}
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-bold">{success}</div>}

      {/* TAB: ADD WIZARD */}
      {tab === 'add' && (
        <div className="space-y-6">
            {/* STEP 1: SUB-TYPE */}
            {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <SelectionCard title="Long Note" desc="Detailed course material." icon="📄" onClick={() => { setSubType('long_note'); setStep(2); }} />
                    <SelectionCard title="Short Note" desc="Brief summaries and points." icon="📝" onClick={() => { setSubType('short_note'); setStep(2); }} />
                    <SelectionCard title="Learning Byte" desc="Bite-sized visual facts." icon="⚡" onClick={() => { setSubType('byte'); setStep(2); }} />
                </div>
            )}

            {/* STEP 2: GITHUB FETCH & SUBMIT */}
            {step === 2 && (
                <div className="glass-card p-6 sm:p-10 border-white/5 animate-in fade-in zoom-in-95">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Common Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Major Focus</label>
                                <select value={major} onChange={(e: any) => setMajor(e.target.value)} className="modern-input w-full">
                                    <option value="Both">Both CSE & Software</option>
                                    <option value="CSE">Computer Science (CSE)</option>
                                    <option value="Software">Software Engineering</option>
                                </select>
                            </div>
                            <InputGroup 
                                label="Topic/Subject" 
                                value={topic} 
                                onChange={setTopic} 
                                placeholder="E.g. Database Systems" 
                                required 
                            />
                            <InputGroup 
                                label="Specific Title" 
                                value={title} 
                                onChange={setTitle} 
                                placeholder="E.g. Normalization Forms" 
                                required 
                            />
                        </div>

                        {/* GitHub Fetch UI */}
                        <div className="space-y-4 border-t border-white/5 pt-6 mt-4 opacity-100 transition-opacity">
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <InputGroup label="GitHub Raw URL (.md)" value={githubUrl} onChange={setGithubUrl} placeholder="https://raw.githubusercontent.com/.../note.md" required />
                                <button 
                                    type="button" 
                                    onClick={handleGitHubFetch} 
                                    disabled={isFetching} 
                                    className="btn-secondary px-8 py-[18px] font-black uppercase text-xs italic"
                                >
                                    {isFetching ? 'Fetching...' : 'Verify Content'}
                                </button>
                            </div>
                            {fetchedData && (
                                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                                    <h4 className="text-accent-purple font-black uppercase text-[10px]">Markdown Preview Extracted</h4>
                                    <div className="max-h-60 overflow-y-auto text-xs text-gray-400 space-y-2 prose prose-invert prose-purple">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{fetchedData.body || fetchedData.content || ''}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isFetching || !fetchedData} 
                            className="btn-primary w-full py-4 text-sm font-black uppercase italic tracking-widest disabled:opacity-50 mt-6 shadow-xl shadow-purple-500/20"
                        >
                            {isFetching ? 'Processing Matrix Link...' : 'Synchronize via GitHub to Database'}
                        </button>
                    </form>
                </div>
            )}
        </div>
      )}

      {/* TAB: MANAGE / LIST */}
      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="modern-input w-full max-w-xl"
              placeholder="Search by topic, title, or type..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item: any) => (
              <div key={item.id} className="glass-card p-5 flex flex-col gap-3 group hover:border-accent-purple/40 hover:shadow-lg transition-all border-white/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-2 text-[10px] font-black uppercase tracking-widest opacity-80 rounded-bl-xl ${item._type === 'byte' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {item.label || item._type}
                </div>
                <div className="min-w-0 pr-16">
                  <p className="text-white text-sm font-bold leading-relaxed truncate">{item.title}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{item.topic}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-dark-500 text-gray-400 font-bold uppercase">{item.major || 'Both'}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">{item.source}</span>
                  </div>
                </div>
                
                {/* Delete Layout Action */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleDelete(item.id, item._type)} 
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-center transition-colors"
                    >
                        Delete
                    </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-gray-600 font-bold uppercase tracking-widest py-20 text-xs">No notes or bytes found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectionCard({ title, desc, icon, onClick, variant = 'purple' }: { title: string, desc: string, icon: string, onClick: () => void, variant?: 'purple' | 'indigo' }) {
    return (
        <button 
            type="button"
            onClick={onClick}
            className={`group p-6 text-left rounded-3xl border-2 transition-all duration-300 relative overflow-hidden bg-[#11152a] min-h-[140px] flex flex-col justify-center ${
                variant === 'purple' 
                ? 'border-white/5 hover:border-accent-purple/40 hover:shadow-2xl hover:shadow-purple-500/10' 
                : 'border-white/5 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10'
            }`}
        >
            <div className="text-3xl mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-all origin-left">{icon}</div>
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-1 leading-tight">{title}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed pr-4">{desc}</p>
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity ${variant === 'purple' ? 'bg-accent-purple' : 'bg-indigo-500'}`} />
        </button>
    );
}

function InputGroup({ label, value, onChange, placeholder, required = false }: any) {
    return (
        <div className="space-y-1 flex-1 w-full relative">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">{label} {required && <span className="text-accent-purple">*</span>}</label>
            <input
                type="text"
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="modern-input w-full"
                placeholder={placeholder}
            />
        </div>
    );
}
