'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveCustomNote, saveCustomQuestion, saveCustomByte, type Note, type Question, type Byte } from '@/lib/dataLoader';
import { fetchGitHubNote } from '@/lib/githubFetcher';
import { useAuth } from '@/components/AuthProvider';

type ContentType = 'note' | 'byte' | 'quiz' | 'github' | null;
type QuestionMode = 'practice' | 'exam' | 'model' | null;

export default function UploadPage() {
  const router = useRouter();
  const { isGuest } = useAuth();
  
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<ContentType>(null);
  const [questionMode, setQuestionMode] = useState<QuestionMode>(null);

  useEffect(() => {
    if (isGuest) {
      router.replace('/dashboard');
    }
  }, [isGuest, router]);
  
  // Note State
  const [noteCourse, setNoteCourse] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteImage, setNoteImage] = useState('');
  const [noteLink, setNoteLink] = useState('');
  const [noteLabel, setNoteLabel] = useState('Auto');
  const [notePreview, setNotePreview] = useState(false);

  // Byte State
  const [byteTopic, setByteTopic] = useState('');
  const [byteTitle, setByteTitle] = useState('');
  const [byteContent, setByteContent] = useState('');
  const [byteImage, setByteImage] = useState('');
  const [byteVideo, setByteVideo] = useState('');
  const [byteQuestions, setByteQuestions] = useState('');

  // Quiz State
  const [quizMode, setQuizMode] = useState<'single' | 'bulk'>('single');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [quizAnswer, setQuizAnswer] = useState('A');
  const [quizHint, setQuizHint] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [bulkQuizJson, setBulkQuizJson] = useState('');
  const [bulkQuizError, setBulkQuizError] = useState('');

  // GitHub State
  const [githubUrl, setGithubUrl] = useState('');
  const [githubCourse, setGithubCourse] = useState('');
  const [githubTarget, setGithubTarget] = useState<'note' | 'byte'>('note');
  const [isFetching, setIsFetching] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [fetchedContent, setFetchedContent] = useState<Note | null>(null);

  const determineNoteLabel = (body: string) => {
    const wordCount = body.trim().split(/\s+/).length;
    if (body.toLowerCase().includes('syllabus') || body.toLowerCase().includes('grading logic')) {
      return 'Syllabus';
    }
    if (wordCount < 100) return 'Short Note';
    return 'Course Material';
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteCourse || !noteTitle || !noteBody) return;
    const finalLabel = noteLabel === 'Auto' ? determineNoteLabel(noteBody) : noteLabel;
    const newNote: Note = {
      id: `local_note_${Date.now()}`,
      topic: noteCourse,
      course: noteCourse,
      title: noteTitle,
      body: noteBody,
      source: 'Local',
      images: noteImage ? [noteImage] : [],
      links: noteLink ? [noteLink] : [],
      date: new Date().toISOString(),
      label: finalLabel,
    };
    saveCustomNote(newNote);
    router.push('/notes');
  };

  const handleByteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!byteTopic || !byteTitle || !byteContent) return;
    const qIds = byteQuestions.split(',').map(s => s.trim()).filter(Boolean);
    const newByte: Byte = {
      id: `local_byte_${Date.now()}`,
      topic: byteTopic,
      title: byteTitle,
      content: byteContent,
      images: byteImage ? [byteImage] : [],
      videoUrl: byteVideo || undefined,
      relatedQuestionIds: qIds.length > 0 ? qIds : undefined,
      date: new Date().toISOString(),
      source: 'Local',
    };
    saveCustomByte(newByte);
    router.push('/bytes');
  };

  const parseBulkMarkdown = (text: string) => {
    const questions: any[] = [];
    const entries = text.split(/---+\n?/).filter(Boolean);

    entries.forEach(entry => {
      const lines = entry.trim().split('\n');
      let q: any = { options: [], id: `q_bulk_${Date.now()}_${Math.random()}` };
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### Topic:')) q.topic = trimmed.replace('### Topic:', '').trim();
        else if (trimmed.startsWith('**Difficulty:')) q.difficulty = trimmed.replace('**Difficulty:', '').replace(/\*/g, '').replace('Difficulty:', '').trim().toLowerCase() || 'medium';
        else if (trimmed.startsWith('**Question:**')) q.question = trimmed.replace('**Question:**', '').trim();
        else if (trimmed.match(/^[A-D]\)/)) q.options.push(trimmed.replace(/^[A-D]\)/, '').trim());
        else if (trimmed.startsWith('**Answer:**')) {
          const letter = trimmed.replace('**Answer:**', '').trim().toUpperCase();
          q.answer_letter = letter;
        }
        else if (trimmed.startsWith('**Explanation:**')) q.explanation = trimmed.replace('**Explanation:**', '').trim();
      });

      if (q.answer_letter) {
        const idx = q.answer_letter.charCodeAt(0) - 65;
        q.answer = q.options[idx];
        delete q.answer_letter;
      }

      if (q.question && q.options.length >= 2 && q.answer && q.topic) {
          questions.push(q);
      }
    });
    return questions;
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const source = 
      questionMode === 'exam' ? 'Archived Exams' : 
      questionMode === 'model' ? 'Model Exit Exam' : 
      'Course Notes';

    if (quizMode === 'single') {
      if (!quizQuestion || quizOptions.some(o => !o) || !quizTopic) return;
      const newQuiz: Question = {
        id: `q_${Date.now()}`,
        question: quizQuestion,
        options: quizOptions,
        answer: quizOptions[quizAnswer.charCodeAt(0) - 65],
        explanation: quizHint || 'Custom user question.', 
        hint: quizHint,
        topic: quizTopic,
        difficulty: quizDifficulty,
        source: source,
      };
      saveCustomQuestion(newQuiz);
      router.push(questionMode === 'practice' ? '/questions' : '/exam');
    } else {
      setBulkQuizError('');
      try {
        let parsed: any[] = [];
        if (bulkQuizJson.trim().startsWith('[')) {
          parsed = JSON.parse(bulkQuizJson);
        } else {
          parsed = parseBulkMarkdown(bulkQuizJson);
        }

        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Could not parse questions. Check format.");
        
        parsed.forEach(q => {
          if (!q.question || !q.options || !q.answer || !q.topic) {
            throw new Error(`Missing fields on question: ${q.question?.substring(0, 30) || 'Unknown'}`);
          }
          q.id = q.id || `q_bulk_${Date.now()}_${Math.random()}`;
          q.source = source;
          q.difficulty = q.difficulty || 'medium';
          q.explanation = q.explanation || 'Bulk imported question.';
          saveCustomQuestion(q as Question);
        });
        router.push(questionMode === 'practice' ? '/questions' : '/exam');
      } catch (err: any) {
        setBulkQuizError(err.message || "Invalid Format");
      }
    }
  };

  const handleGithubFetch = async () => {
    if (!githubUrl || !githubCourse) return;
    setIsFetching(true);
    setGithubError('');
    try {
      const gContent = await fetchGitHubNote(githubUrl, githubCourse);
      gContent.date = new Date().toISOString();
      gContent.label = determineNoteLabel(gContent.body || '');
      setFetchedContent(gContent);
    } catch (err: any) {
      setGithubError(err.message || 'Fetch failed');
    } finally {
      setIsFetching(false);
    }
  };

  const saveGithubContent = () => {
    if (!fetchedContent) return;
    
    if (githubTarget === 'byte') {
      const newByte: Byte = {
        id: `local_byte_${Date.now()}`,
        topic: githubCourse,
        title: fetchedContent.title,
        content: fetchedContent.body || '',
        images: fetchedContent.images,
        date: new Date().toISOString(),
        source: 'GitHub',
      };
      saveCustomByte(newByte);
      router.push('/bytes');
    } else {
      saveCustomNote(fetchedContent);
      router.push('/notes');
    }
  };

  const resetSelection = () => {
    setStep(1);
    setContentType(null);
    setQuestionMode(null);
  };

  const selectContentType = (type: ContentType) => {
    setContentType(type);
    if (type === 'quiz') {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const selectQuestionMode = (mode: QuestionMode) => {
    setQuestionMode(mode);
    setStep(3);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in pb-20">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Unified Upload</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase font-bold tracking-widest">Create or import study resources</p>
        </div>
        {step > 1 && (
            <button onClick={resetSelection} className="text-[10px] font-black uppercase tracking-widest text-accent-purple hover:text-white transition-colors">
                ← Start Over
            </button>
        )}
      </div>

      {/* STEP 1: Content Type Selection */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
          <SelectionCard 
            title="Markdown Note" 
            desc="Full-length study materials with rich formatting." 
            icon="📝" 
            onClick={() => selectContentType('note')} 
          />
          <SelectionCard 
            title="Learning Byte" 
            desc="Focused, bite-sized facts and concepts." 
            icon="⚡" 
            onClick={() => selectContentType('byte')} 
          />
          <SelectionCard 
            title="Question Bank" 
            desc="Create practice quizzes or exam simulations." 
            icon="❓" 
            onClick={() => selectContentType('quiz')} 
          />
          <SelectionCard 
            title="GitHub Import" 
            desc="Sync markdown notes directly from GitHub." 
            icon="🐱" 
            onClick={() => selectContentType('github')} 
          />
        </div>
      )}

      {/* STEP 2: Question Mode Selection */}
      {step === 2 && contentType === 'quiz' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
          <SelectionCard 
            title="Practice Question" 
            desc="General study material for routine practice." 
            icon="🎯" 
            onClick={() => selectQuestionMode('practice')} 
            variant="purple"
          />
          <SelectionCard 
            title="Past Exam Question" 
            desc="Actual questions from previous exit exams." 
            icon="🎓" 
            onClick={() => selectQuestionMode('exam')} 
            variant="indigo"
          />
          <SelectionCard 
            title="Model Exit Exam" 
            desc="Curated model questions for exit exam prep." 
            icon="🏆" 
            onClick={() => selectQuestionMode('model')} 
            variant="purple"
          />
        </div>
      )}

      {/* STEP 3: Forms */}
      {step === 3 && (
        <div className="glass-card p-8 sm:p-12 border-white/5 animate-in fade-in zoom-in-95">
          {contentType === 'note' && (
            <form onSubmit={handleNoteSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Course" value={noteCourse} onChange={setNoteCourse} placeholder="Computer Architecture" required />
                  <InputGroup label="Title" value={noteTitle} onChange={setNoteTitle} placeholder="MIPS Architecture Intro" required />
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Content (Markdown)</label>
                    <button type="button" onClick={() => setNotePreview(!notePreview)} className="text-[10px] font-black uppercase text-accent-purple hover:underline">
                        {notePreview ? 'Edit' : 'Preview'}
                    </button>
                 </div>
                 {notePreview ? (
                   <div className="prose prose-invert prose-purple max-w-none p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[300px]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{noteBody || '*Empty*'}</ReactMarkdown>
                   </div>
                 ) : (
                   <textarea
                     required
                     value={noteBody}
                     onChange={(e) => setNoteBody(e.target.value)}
                     className="modern-textarea min-h-[300px]"
                     placeholder="# Introduction\nStart writing..."
                   />
                 )}
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Image URL" value={noteImage} onChange={setNoteImage} placeholder="https://..." />
                  <InputGroup label="Resource Link" value={noteLink} onChange={setNoteLink} placeholder="Drive/External link" />
               </div>
               <button type="submit" className="btn-primary w-full py-4 font-black uppercase italic tracking-widest">Deploy Note</button>
            </form>
          )}

          {contentType === 'byte' && (
            <form onSubmit={handleByteSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Topic" value={byteTopic} onChange={setByteTopic} placeholder="Networking" required />
                  <InputGroup label="Byte Title" value={byteTitle} onChange={setByteTitle} placeholder="OSI Model Layer 1" required />
               </div>
               <textarea
                 required
                 value={byteContent}
                 onChange={(e) => setByteContent(e.target.value)}
                 className="modern-textarea min-h-[150px]"
                 placeholder="Write short content..."
               />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Illustration URL" value={byteImage} onChange={setByteImage} placeholder="https://..." />
                  <InputGroup label="YouTube URL" value={byteVideo} onChange={setByteVideo} placeholder="Video walk-through" />
               </div>
               <InputGroup label="Sync Question IDs" value={byteQuestions} onChange={setByteQuestions} placeholder="q_123, q_456" />
               <button type="submit" className="btn-primary w-full py-4 font-black uppercase italic tracking-widest">Deploy Byte</button>
            </form>
          )}

          {contentType === 'quiz' && (
            <div className="space-y-8">
                <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                    <button onClick={() => setQuizMode('single')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${quizMode === 'single' ? 'bg-accent-purple text-white' : 'text-gray-500 hover:text-white'}`}>Single Entry</button>
                    <button onClick={() => setQuizMode('bulk')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${quizMode === 'bulk' ? 'bg-accent-purple text-white' : 'text-gray-500 hover:text-white'}`}>Bulk Import</button>
                </div>

                <form onSubmit={handleQuizSubmit} className="space-y-8">
                    {quizMode === 'single' ? (
                        <>
                            <textarea
                                required
                                value={quizQuestion}
                                onChange={(e) => setQuizQuestion(e.target.value)}
                                className="modern-textarea min-h-[150px]"
                                placeholder="Enter the question text here..."
                            />
                            <div className="space-y-4">
                                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                    <div key={letter} className="flex gap-4 items-center group">
                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${quizAnswer === letter ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-500'}`}>
                                            {letter}
                                        </span>
                                        <input
                                            type="text"
                                            required
                                            value={quizOptions[idx]}
                                            onChange={(e) => {
                                                const n = [...quizOptions];
                                                n[idx] = e.target.value;
                                                setQuizOptions(n);
                                            }}
                                            className="modern-input flex-1"
                                            placeholder={`Option ${letter}`}
                                        />
                                        <button type="button" onClick={() => setQuizAnswer(letter)} className={`text-[10px] font-black uppercase tracking-widest transition-all ${quizAnswer === letter ? 'text-neon-green' : 'text-gray-600 hover:text-gray-300'}`}>
                                            Correct
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label="Topic" value={quizTopic} onChange={setQuizTopic} placeholder="OS" required />
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Difficulty</label>
                                    <select value={quizDifficulty} onChange={(e: any) => setQuizDifficulty(e.target.value)} className="modern-input w-full">
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <InputGroup label="Analysis/Hint" value={quizHint} onChange={setQuizHint} placeholder="Explain why the answer is correct..." />
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-accent-purple/5 border border-accent-purple/10 text-[10px] text-gray-400 font-medium leading-relaxed">
                                <span className="text-accent-purple font-black uppercase">Bulk Formats:</span><br/>
                                • <span className="text-white font-bold text-[9px]">JSON:</span> {'[{"question": "...", "options": ["A","B","C","D"], "answer": "Correct Option", "topic": "...", "explanation": "..."}]'}<br/>
                                • <span className="text-white font-bold text-[9px]">Markdown:</span><br/>
                                <pre className="mt-2 p-2 bg-black/40 rounded text-[8px] font-mono leading-tight">
{`### Topic: Networking
**Difficulty: Medium**
**Question:** What is IP?
A) Internet Protocol
B) Intranet Protocol
**Answer:** A
**Explanation:** It is the principal communications protocol...
---`}
                                </pre>
                            </div>
                            <textarea
                                required
                                value={bulkQuizJson}
                                onChange={(e) => setBulkQuizJson(e.target.value)}
                                className="modern-textarea min-h-[350px] font-mono text-xs"
                                placeholder="Paste your JSON array or Markdown questions here..."
                            />
                            {bulkQuizError && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-4 rounded-xl border border-red-500/10">Error: {bulkQuizError}</p>}
                        </div>
                    )}
                    <button type="submit" className="btn-primary w-full py-4 font-black uppercase italic tracking-widest">Commit Questions</button>
                </form>
            </div>
          )}

          {contentType === 'github' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputGroup label="Raw MD URL" value={githubUrl} onChange={setGithubUrl} placeholder="https://raw.githubusercontent..." required />
                  <InputGroup label="Target Course" value={githubCourse} onChange={setGithubCourse} placeholder="Algorithms" required />
                  <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Import As</label>
                      <select value={githubTarget} onChange={(e: any) => setGithubTarget(e.target.value)} className="modern-input w-full">
                          <option value="note">Markdown Note</option>
                          <option value="byte">Learning Byte</option>
                      </select>
                  </div>
               </div>
               <button onClick={handleGithubFetch} disabled={isFetching} className="btn-secondary w-full py-4 font-black uppercase italic tracking-widest">
                  {isFetching ? 'Parsing Stream...' : 'Fetch Resource'}
               </button>
               {githubError && <p className="text-red-400 text-xs italic">{githubError}</p>}
               {fetchedContent && (
                 <div className="space-y-6 pt-6 border-t border-white/5 animate-in slide-in-from-bottom-2">
                    <h3 className="text-xl font-black text-white italic uppercase">{fetchedContent.title}</h3>
                    <div className="max-h-96 overflow-y-auto p-6 rounded-2xl bg-black/20 border border-white/5 text-sm prose prose-invert prose-purple max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{fetchedContent.body || ''}</ReactMarkdown>
                    </div>
                    <button onClick={saveGithubContent} className="btn-primary w-full py-4 font-black uppercase italic tracking-widest">Save to Vault</button>
                 </div>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectionCard({ title, desc, icon, onClick, variant = 'purple' }: { title: string, desc: string, icon: string, onClick: () => void, variant?: 'purple' | 'indigo' }) {
    return (
        <button 
            onClick={onClick}
            className={`group p-8 text-left rounded-3xl border-2 transition-all duration-300 relative overflow-hidden bg-[#11152a] ${
                variant === 'purple' 
                ? 'border-white/5 hover:border-accent-purple/40 hover:shadow-2xl hover:shadow-purple-500/10' 
                : 'border-white/5 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10'
            }`}
        >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1">{title}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
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
