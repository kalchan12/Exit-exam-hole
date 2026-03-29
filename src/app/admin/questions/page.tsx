'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/components/AuthProvider';
import { getQuestions, invalidateQuestionsCache, type Question } from '@/lib/dataLoader';
import { saveQuestionToSupabase, updateQuestionInSupabase, deleteQuestionFromSupabase } from '@/lib/supabaseLoader';
import { parseQuestionsFromJson, parseQuestionsFromMarkdown } from '@/lib/parsers';

type Tab = 'add' | 'list';
type SubType = 'practice' | 'past_exam' | 'model_exam' | null;
type Method = 'single' | 'bulk' | 'github' | null;
type Major = 'CSE' | 'Software' | 'Both';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('add');

  // Add Wizard State
  const [step, setStep] = useState(1);
  const [subType, setSubType] = useState<SubType>(null);
  const [method, setMethod] = useState<Method>(null);

  // Form Metadata
  const [major, setMajor] = useState<Major>('Both');
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  
  // Single Question Editing / Fetching
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Bulk / GitHub Content
  const [manualContent, setManualContent] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [fetchedData, setFetchedData] = useState<any>(null);

  // UI state
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // List state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  useEffect(() => {
    if (!authLoading && profile?.username !== 'psycho') {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, router]);

  const loadQuestions = useCallback(async () => {
    invalidateQuestionsCache();
    const qs = await getQuestions();
    setQuestions(qs);
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const resetFlow = () => {
    if (!editingQuestion) {
      setStep(1);
      setSubType(null);
      setMethod(null);
    }
    setError('');
    setSuccess('');
    setFetchedData(null);
    setManualContent('');
    setGithubUrl('');
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setExplanation('');
    setTitle('');
    setYear('');
    setTopic('');
    setEditingQuestion(null);
    setShowPreview(false);
    setIsFetching(false);
  };

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setQuestionText(q.question);
    setOptions(q.options.length >= 4 ? q.options.slice(0, 4) : [...q.options, ...Array(4 - q.options.length).fill('')]);
    const ansIdx = q.options.indexOf(q.answer);
    setCorrectAnswer(ansIdx >= 0 ? ansIdx : 0);
    setExplanation(q.explanation || '');
    setTopic(q.topic);
    setDifficulty(q.difficulty as 'easy' | 'medium' | 'hard');
    setTitle(q.source || 'Manual');
    
    // Auto-select Single method
    setSubType('practice');
    setMethod('single');
    setStep(3);
    setTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question permanently?')) return;
    const success = await deleteQuestionFromSupabase(id);
    if (success) {
      await loadQuestions();
    } else {
      alert('Failed to delete.');
    }
  };

  const handleGitHubFetch = async () => {
    if (!githubUrl || !title) {
        setError('Please provide a URL and Title.');
        return;
    }
    setIsFetching(true);
    setError('');
    // Notice: we can't reliably parse raw MD questions from github unless they follow a strict format.
    // Assuming bulk JSON/MD parser applies
    try {
        const res = await fetch(githubUrl);
        if (!res.ok) throw new Error('Failed to fetch from GitHub URL');
        const text = await res.text();
        const parsed = text.trim().startsWith('[') 
            ? parseQuestionsFromJson(text)
            : parseQuestionsFromMarkdown(text, title);
        setFetchedData(parsed);
    } catch (err: any) {
        setError(err.message || 'Failed to fetch or parse from GitHub.');
    } finally {
        setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsFetching(true);

    try {
      let itemsToSave: any[] = [];

      if (method === 'github') {
          if (!fetchedData) throw new Error('Please fetch content first.');
          itemsToSave = Array.isArray(fetchedData) ? fetchedData : [fetchedData];
      } else if (method === 'bulk') {
          if (manualContent.trim().startsWith('[') || manualContent.includes('---')) {
              const parsed = manualContent.trim().startsWith('[') 
                  ? parseQuestionsFromJson(manualContent)
                  : parseQuestionsFromMarkdown(manualContent, title);
              itemsToSave = parsed;
          } else {
              throw new Error('Please use the Bulk format (JSON array or Markdown split by ---).');
          }
      } else {
          // Single Edit or Create
          if (!questionText.trim() || options.some(o => !o.trim()) || !topic.trim() || !title.trim()) {
            throw new Error('Please fill all required single question fields.');
          }
          const id = editingQuestion?.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          itemsToSave = [{
            id,
            question: questionText.trim(),
            options: options.map(o => o.trim()),
            answer: options[correctAnswer].trim(),
            explanation: explanation.trim(),
            topic: topic.trim(),
            difficulty,
            source: title.trim() // Title is the source
          }];
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of itemsToSave) {
          // Apply sub-type specific overrides
          if (subType === 'past_exam' || subType === 'model_exam') {
              item.source = title;
              item.year = year;
          } else {
              // Practice
              item.source = title;
          }

          let ok;
          if (editingQuestion && method === 'single') {
             ok = await updateQuestionInSupabase(item.id, item);
          } else {
             ok = await saveQuestionToSupabase(item);
          }
          if (ok) successCount++;
          else errorCount++;
      }

      setSuccess(`Saved ${successCount} questions. ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
      setTimeout(async () => {
          await loadQuestions();
          resetFlow();
          setTab('list');
      }, 1500);

    } catch (err: any) {
        setError(err.message || 'Failed to save data. Check console.');
    } finally {
        setIsFetching(false);
    }
  };

  // Filtering for list
  const sources = Array.from(new Set(questions.map(q => q.source))).sort();
  const filtered = questions.filter(q => {
    if (filterSource !== 'all' && q.source !== filterSource) return false;
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      return q.question.toLowerCase().includes(sq) || q.topic.toLowerCase().includes(sq) || q.id.toLowerCase().includes(sq);
    }
    return true;
  });

  if (authLoading) return <div className="text-gray-500 text-center py-20">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-20">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">Question Manager</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest">
            {tab === 'add' ? (step === 1 ? 'Step 1: Exam Type' : step === 2 ? 'Step 2: Upload Method' : 'Step 3: Content & Publishing') : `${questions.length} questions in database`}
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
                    Add Content
                </button>
                <button
                    onClick={() => setTab('list')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    tab === 'list' ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Manage Database
                </button>
            </div>
            {tab === 'add' && step > 1 && !editingQuestion && (
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
                    <SelectionCard title="Practice" desc="Common resource questions." icon="🧩" onClick={() => { setSubType('practice'); setStep(2); }} />
                    <SelectionCard title="Past Exam" desc="From previous exit exams." icon="🎓" onClick={() => { setSubType('past_exam'); setStep(2); }} />
                    <SelectionCard title="Model Exam" desc="Curated prep questions." icon="🏆" onClick={() => { setSubType('model_exam'); setStep(2); }} />
                </div>
            )}

            {/* STEP 2: METHOD */}
            {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <SelectionCard title="Single Question" desc="Create or edit manually." icon="✏️" onClick={() => { setMethod('single'); setStep(3); }} />
                    <SelectionCard title="Bulk Manual" desc="Paste JSON or Markdown." icon="✍️" onClick={() => { setMethod('bulk'); setStep(3); }} />
                    <SelectionCard title="GitHub Bulk" desc="Sync array directly from Raw URL." icon="🐱" onClick={() => { setMethod('github'); setStep(3); }} />
                </div>
            )}

            {/* STEP 3: FORM */}
            {step === 3 && (
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
                                label={method === 'single' ? "Source / Title" : "Bulk Questions Title/Source"} 
                                value={title} 
                                onChange={setTitle} 
                                placeholder="E.g. Exit Exam 2017" 
                                required 
                            />
                            {(subType === 'past_exam' || subType === 'model_exam') && (
                                <InputGroup label="Exam Year" value={year} onChange={setYear} placeholder="2017" required={false} />
                            )}
                        </div>

                        {/* Method: Single Question UI */}
                        {method === 'single' && (
                            <div className="space-y-8 mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label="Topic" value={topic} onChange={setTopic} placeholder="E.g. Algorithms" required />
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Difficulty</label>
                                        <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="modern-input w-full">
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Question Content (MD)</label>
                                        <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-[10px] font-black uppercase text-accent-purple">
                                            {showPreview ? 'Edit' : 'Preview'}
                                        </button>
                                    </div>
                                    {showPreview ? (
                                        <div className="prose prose-invert prose-purple max-w-none p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[120px]">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{questionText || '*No content*'}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <textarea
                                            value={questionText}
                                            onChange={e => setQuestionText(e.target.value)}
                                            className="modern-textarea min-h-[100px] font-mono text-xs"
                                            placeholder="What is the time complexity of binary search?"
                                            required
                                        />
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Options (4 choices)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {options.map((opt, i) => (
                                            <div key={i} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="radio" 
                                                        name="correctAnswer" 
                                                        checked={correctAnswer === i} 
                                                        onChange={() => setCorrectAnswer(i)}
                                                        className="accent-purple-500 w-4 h-4 cursor-pointer"
                                                        title="Mark as Correct Answer"
                                                    />
                                                    <span className={`text-[10px] uppercase font-black tracking-widest ${correctAnswer === i ? 'text-green-400' : 'text-gray-500'}`}>
                                                        {correctAnswer === i ? 'Correct Choice' : `Option ${String.fromCharCode(65 + i)}`}
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...options];
                                                        newOpts[i] = e.target.value;
                                                        setOptions(newOpts);
                                                    }}
                                                    className={`modern-input ${correctAnswer === i ? 'border border-green-500/40 bg-green-500/5' : ''}`}
                                                    placeholder={`Enter option ${String.fromCharCode(65 + i)}`}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Explanation (MD)</label>
                                    <textarea
                                        value={explanation}
                                        onChange={e => setExplanation(e.target.value)}
                                        className="modern-textarea min-h-[80px] font-mono text-xs"
                                        placeholder="Optional explanation for the answer..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Method: Bulk Manual Paste */}
                        {method === 'bulk' && (
                            <div className="space-y-4">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">JSON or Markdown Questions Array</label>
                                <textarea
                                  value={manualContent}
                                  onChange={(e) => setManualContent(e.target.value)}
                                  className="modern-textarea min-h-[300px] font-mono text-xs"
                                  placeholder="Paste JSON array logic or bulk text separated by ---"
                                  required
                                />
                            </div>
                        )}

                        {/* GitHub Fetch UI */}
                        {method === 'github' && (
                            <div className="space-y-4 border-t border-white/5 pt-6 mt-4">
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <InputGroup label="Raw URL" value={githubUrl} onChange={setGithubUrl} placeholder="https://raw.githubusercontent.com/.../questions.json" required />
                                    <button 
                                        type="button" 
                                        onClick={handleGitHubFetch} 
                                        disabled={isFetching} 
                                        className="btn-secondary px-8 py-[18px] font-black uppercase text-xs italic"
                                    >
                                        {isFetching ? 'Fetching...' : 'Fetch'}
                                    </button>
                                </div>
                                {fetchedData && (
                                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                                        <h4 className="text-accent-purple font-black uppercase text-[10px]">Preview ({fetchedData.length} items parsed)</h4>
                                        <div className="max-h-60 overflow-y-auto text-xs text-gray-400 space-y-2">
                                            {Array.isArray(fetchedData) && fetchedData.map((q, i) => (
                                                <div key={i} className="pb-2 border-b border-white/5 truncate">• [{q.topic}] {q.question?.substring(0, 80)}...</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isFetching || (method === 'github' && !fetchedData)} 
                            className="btn-primary w-full py-4 text-sm font-black uppercase italic tracking-widest disabled:opacity-50 mt-6 shadow-xl shadow-purple-500/20"
                        >
                            {isFetching ? 'Processing Database Transaction...' : editingQuestion ? 'Update Changes' : 'Publish to Database'}
                        </button>
                    </form>
                </div>
            )}
        </div>
      )}

      {/* TAB: MANAGE / LIST */}
      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="modern-input flex-1 min-w-[200px]"
              placeholder="Search by topic, source or question..."
            />
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="modern-input min-w-[150px]"
            >
              <option value="all">Filter: All Sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filtered.map((q, idx) => (
              <div key={q.id} className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 group hover:border-accent-purple/40 hover:shadow-lg transition-all border-white/5">
                <span className="text-gray-600 font-mono text-xs sm:mt-1 shrink-0 w-8 hidden sm:block">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">{q.topic}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-dark-500 text-gray-400 font-bold uppercase">{q.difficulty}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">{q.source}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-3 sm:mt-0 justify-end">
                  <button onClick={() => handleEdit(q)} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 sm:px-3 sm:py-1 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors w-full">Edit</button>
                  <button onClick={() => handleDelete(q.id)} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 sm:px-3 sm:py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-center transition-colors w-full">Delete</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-gray-600 font-bold uppercase tracking-widest py-20 text-xs">No questions found matching criteria.</div>
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
        <div className="space-y-1 flex-1 w-full">
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
