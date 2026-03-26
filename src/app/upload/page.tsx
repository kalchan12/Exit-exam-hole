'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Note, type Question, type Byte } from '@/lib/dataLoader';
import { fetchGitHubNote, fetchGitHubQuestions } from '@/lib/githubFetcher';
import { useAuth } from '@/components/AuthProvider';
import { saveNoteToSupabase, saveQuestionToSupabase, saveByteToSupabase } from '@/lib/supabaseLoader';
import { parseQuestionsFromJson, parseQuestionsFromMarkdown } from '@/lib/parsers';
import { saveCustomNote, saveCustomQuestion, saveCustomByte } from '@/lib/dataLoader';

// Types for the new unified flow
type Category = 'notes' | 'questions' | null;
type SubType = 'long_note' | 'short_note' | 'byte' | 'practice' | 'past_exam' | 'model_exam' | null;
type Method = 'manual' | 'github' | null;
type Major = 'CSE' | 'Software' | 'Both';

export default function UploadPage() {
  const router = useRouter();
  const { user, profile, isGuest } = useAuth();
  
  // Step State
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category>(null);
  const [subType, setSubType] = useState<SubType>(null);
  const [method, setMethod] = useState<Method>(null);

  // Form Metadata
  const [major, setMajor] = useState<Major>('Both');
  const [year, setYear] = useState('');
  const [course, setCourse] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Content State
  const [manualContent, setManualContent] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [fetchedData, setFetchedData] = useState<any>(null); // For GitHub or Manual parsing preview

  useEffect(() => {
    if (isGuest) {
      router.replace('/dashboard');
    }
  }, [isGuest, router]);

  const resetFlow = () => {
    setStep(1);
    setCategory(null);
    setSubType(null);
    setMethod(null);
    setError('');
    setSuccess('');
    setFetchedData(null);
    setManualContent('');
    setGithubUrl('');
  };

  // Helper to determine note label based on content weight
  const determineNoteLabel = (body: string) => {
    if (subType === 'long_note') return 'Course Material';
    if (subType === 'short_note') return 'Short Note';
    if (subType === 'byte') return 'Learning Byte';
    
    const wordCount = body.trim().split(/\s+/).length;
    if (body.toLowerCase().includes('syllabus')) return 'Syllabus';
    return wordCount < 100 ? 'Short Note' : 'Course Material';
  };

  const handleGitHubFetch = async () => {
    if (!githubUrl || !course) {
        setError('Please provide a URL and Course name.');
        return;
    }
    setIsFetching(true);
    setError('');
    try {
      if (category === 'notes') {
        const note = await fetchGitHubNote(githubUrl, course);
        setFetchedData(note);
      } else {
        const questions = await fetchGitHubQuestions(githubUrl, course);
        setFetchedData(questions);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch from GitHub');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError('You must be logged in to upload.');
        return;
    }
    setError('');
    setIsFetching(true);

    try {
        let itemsToSave: any[] = [];

        if (method === 'github') {
            if (!fetchedData) throw new Error('Please fetch content first.');
            itemsToSave = Array.isArray(fetchedData) ? fetchedData : [fetchedData];
        } else {
            // Manual Logic
            if (category === 'notes') {
                if (subType === 'byte') {
                    itemsToSave = [{
                        id: `byte_${Date.now()}`,
                        topic: topic || course,
                        title: title,
                        content: manualContent,
                        source: 'Local',
                        date: new Date().toISOString()
                    }];
                } else {
                    itemsToSave = [{
                        id: `note_${Date.now()}`,
                        topic: course,
                        title: title,
                        body: manualContent,
                        source: 'Local',
                        label: determineNoteLabel(manualContent),
                        date: new Date().toISOString()
                    }];
                }
            } else {
                // Questions Bulk or Single
                if (manualContent.trim().startsWith('[') || manualContent.includes('---')) {
                    const parsed = manualContent.trim().startsWith('[') 
                        ? parseQuestionsFromJson(manualContent)
                        : parseQuestionsFromMarkdown(manualContent, course);
                    itemsToSave = parsed;
                } else {
                    throw new Error('Please use the Bulk format for manual questions.');
                }
            }
        }

        // Apply shared metadata and save
        for (const item of itemsToSave) {
            item.major = major;
            if (category === 'questions') {
                item.year = year;
                item.source = subType === 'past_exam' ? 'Archived Exams' : subType === 'model_exam' ? 'Model Exit Exam' : 'Resource';
                
                if (method === 'github') {
                    item.githubUrl = githubUrl;
                    // Keep metadata for the list, but we could strip content if desired.
                    // For questions, we'll keep the text but mark it as GitHub source.
                    saveCustomQuestion(item);
                } else {
                    await saveQuestionToSupabase(item, user.id);
                }
            } else if (subType === 'byte') {
                item.source = method === 'github' ? 'GitHub' : 'Local';
                if (method === 'github') {
                   item.githubUrl = githubUrl;
                   saveCustomByte(item);
                } else {
                   await saveByteToSupabase(item, user.id);
                }
            } else {
                item.source = method === 'github' ? 'GitHub' : 'Local';
                if (method === 'github') {
                    item.githubUrl = githubUrl;
                    item.body = ''; // Strip body to ensure live render from GitHub
                    saveCustomNote(item);
                } else {
                    await saveNoteToSupabase(item, user.id);
                }
            }
        }

        setSuccess(`Successfully uploaded ${itemsToSave.length} item(s)!`);
        setTimeout(() => {
            router.push(category === 'notes' ? (subType === 'byte' ? '/bytes' : '/notes') : '/questions');
        }, 1500);

    } catch (err: any) {
        setError(err.message || 'failed to save data');
    } finally {
        setIsFetching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in pb-20">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Unified Hub</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase font-bold tracking-widest">
            Step {step} of 4: {
                step === 1 ? 'Select Category' :
                step === 2 ? 'Select Sub-type' :
                step === 3 ? 'Select Method' :
                'Finalize Content'
            }
          </p>
        </div>
        {step > 1 && (
            <button onClick={resetFlow} className="text-[10px] font-black uppercase tracking-widest text-accent-purple hover:text-white transition-colors">
                ← Restart
            </button>
        )}
      </div>

      {/* STEP 1: CATEGORY */}
      {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
              <SelectionCard 
                title="Notes & Materials" 
                desc="Study guides, course materials, and learning bytes." 
                icon="📚" 
                onClick={() => { setCategory('notes'); setStep(2); }} 
              />
              <SelectionCard 
                title="Questions & Exams" 
                desc="Practice questions, past exams, and model papers." 
                icon="🎯" 
                onClick={() => { setCategory('questions'); setStep(2); }} 
              />
          </div>
      )}

      {/* STEP 2: SUB-TYPE */}
      {step === 2 && category === 'notes' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
              <SelectionCard title="Long Note" desc="Detailed course material." icon="📄" onClick={() => { setSubType('long_note'); setStep(3); }} />
              <SelectionCard title="Short Note" desc="Brief summaries and points." icon="📝" onClick={() => { setSubType('short_note'); setStep(3); }} />
              <SelectionCard title="Learning Byte" desc="Bite-sized visual facts." icon="⚡" onClick={() => { setSubType('byte'); setStep(3); }} />
          </div>
      )}

      {step === 2 && category === 'questions' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
              <SelectionCard title="Practice" desc="Common resource questions." icon="🧩" onClick={() => { setSubType('practice'); setStep(3); }} />
              <SelectionCard title="Past Exam" desc="From previous exit exams." icon="🎓" onClick={() => { setSubType('past_exam'); setStep(3); }} />
              <SelectionCard title="Model Exam" desc="Curated prep questions." icon="🏆" onClick={() => { setSubType('model_exam'); setStep(3); }} />
          </div>
      )}

      {/* STEP 3: METHOD */}
      {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
              <SelectionCard 
                title="Manual Entry" 
                desc="Paste text directly in MD or JSON format." 
                icon="✍️" 
                onClick={() => { setMethod('manual'); setStep(4); }} 
              />
              <SelectionCard 
                title="GitHub Import" 
                desc="Sync directly from a GitHub Raw URL." 
                icon="🐱" 
                onClick={() => { setMethod('github'); setStep(4); }} 
              />
          </div>
      )}

      {/* STEP 4: FINAL FORM */}
      {step === 4 && (
          <div className="glass-card p-8 sm:p-12 border-white/5 animate-in fade-in zoom-in-95">
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
                      <InputGroup label="Course/Topic" value={course} onChange={setCourse} placeholder="Algorithms" required />
                      {(subType === 'past_exam' || subType === 'model_exam') && (
                          <InputGroup label="Exam Year" value={year} onChange={setYear} placeholder="2017" required />
                      )}
                      {method === 'manual' && category === 'notes' && (
                          <InputGroup label="Content Title" value={title} onChange={setTitle} placeholder="Introduction to Graph" required />
                      )}
                  </div>

                  {/* Manual Paste */}
                  {method === 'manual' && (
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                                {category === 'notes' ? 'Markdown Content' : 'JSON or Markdown Questions'}
                            </label>
                            {category === 'notes' && (
                                <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-[10px] font-black uppercase text-accent-purple">
                                    {showPreview ? 'Edit' : 'Preview'}
                                </button>
                            )}
                          </div>
                          {showPreview ? (
                              <div className="prose prose-invert prose-purple max-w-none p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[300px]">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{manualContent || '*No content*'}</ReactMarkdown>
                              </div>
                          ) : (
                              <textarea
                                value={manualContent}
                                onChange={(e) => setManualContent(e.target.value)}
                                className="modern-textarea min-h-[300px] font-mono text-xs"
                                placeholder={category === 'notes' ? "# Title\nContent..." : "Paste JSON or Bulk MD Questions..."}
                                required
                              />
                          )}
                      </div>
                  )}

                  {/* GitHub URL */}
                  {method === 'github' && (
                      <div className="space-y-6">
                          <div className="flex gap-4">
                            <InputGroup label="Raw URL" value={githubUrl} onChange={setGithubUrl} placeholder="https://raw.githubusercontent.com/..." required />
                            <button 
                                type="button" 
                                onClick={handleGitHubFetch} 
                                disabled={isFetching} 
                                className="btn-secondary px-8 mt-6 font-black uppercase text-xs italic"
                            >
                                {isFetching ? 'Fetching...' : 'Fetch'}
                            </button>
                          </div>
                          {fetchedData && (
                              <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                                  <h4 className="text-accent-purple font-black uppercase text-[10px]">Fetched Preview</h4>
                                  <div className="max-h-60 overflow-y-auto text-xs text-gray-400 space-y-2">
                                      {Array.isArray(fetchedData) ? (
                                          fetchedData.map((q, i) => <div key={i} className="pb-2 border-b border-white/5">• {q.question?.substring(0, 80)}...</div>)
                                      ) : (
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fetchedData.body || fetchedData.content || ''}</ReactMarkdown>
                                      )}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {error && <p className="text-red-400 text-[10px] font-black uppercase bg-red-500/5 p-4 rounded-xl border border-red-500/10 italic">Error: {error}</p>}
                  {success && <p className="text-neon-green text-[10px] font-black uppercase bg-green-500/5 p-4 rounded-xl border border-green-500/10 italic">{success}</p>}

                  <button 
                    type="submit" 
                    disabled={isFetching || (method === 'github' && !fetchedData)} 
                    className="btn-primary w-full py-4 font-black uppercase italic tracking-widest disabled:opacity-50"
                  >
                    {isFetching ? 'Saving to Cloud...' : 'Deploy to Database'}
                  </button>
              </form>
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
            className={`group p-8 text-left rounded-3xl border-2 transition-all duration-300 relative overflow-hidden bg-[#11152a] min-h-[160px] flex flex-col justify-center ${
                variant === 'purple' 
                ? 'border-white/5 hover:border-accent-purple/40 hover:shadow-2xl hover:shadow-purple-500/10' 
                : 'border-white/5 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10'
            }`}
        >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left">{icon}</div>
            <h3 className="text-cl font-black text-white italic uppercase tracking-tighter mb-1 leading-tight">{title}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed">{desc}</p>
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${variant === 'purple' ? 'bg-accent-purple' : 'bg-indigo-500'}`} />
        </button>
    );
}

function InputGroup({ label, value, onChange, placeholder, required = false }: any) {
    return (
        <div className="space-y-1 flex-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">{label}</label>
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
