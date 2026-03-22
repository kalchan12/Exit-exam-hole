'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveCustomNote, saveCustomQuestion, saveCustomByte, type Note, type Question, type Byte } from '@/lib/dataLoader';
import { fetchGitHubNote } from '@/lib/githubFetcher';
import { useAuth } from '@/components/AuthProvider';

type Tab = 'note' | 'byte' | 'quiz' | 'github';

export default function UploadPage() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('note');

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
  const [quizSource, setQuizSource] = useState('Course Notes');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [bulkQuizJson, setBulkQuizJson] = useState('');
  const [bulkQuizError, setBulkQuizError] = useState('');

  // GitHub State
  const [githubUrl, setGithubUrl] = useState('');
  const [githubCourse, setGithubCourse] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [fetchedNote, setFetchedNote] = useState<Note | null>(null);

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
      id: `local_note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      id: `local_byte_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizMode === 'single') {
      if (!quizQuestion || quizOptions.some(o => !o) || !quizTopic) return;
      const newQuiz: Question = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        question: quizQuestion,
        options: quizOptions,
        answer: quizOptions[quizAnswer.charCodeAt(0) - 65],
        explanation: quizHint || 'Custom user question.', 
        hint: quizHint,
        topic: quizTopic,
        difficulty: quizDifficulty,
        source: quizSource,
      };
      saveCustomQuestion(newQuiz);
      router.push('/questions');
    } else {
      // Bulk parse
      setBulkQuizError('');
      try {
        const parsed = JSON.parse(bulkQuizJson);
        if (!Array.isArray(parsed)) throw new Error("Root must be an array of objects");
        parsed.forEach(q => {
          if (!q.question || !q.options || !q.answer || !q.topic || !q.difficulty) {
            throw new Error(`Missing required fields on question: ${q.question || 'Unknown'}`);
          }
          if (!q.id) q.id = `q_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          if (!q.source) q.source = 'Local Bulk Import';
          saveCustomQuestion(q as Question);
        });
        router.push('/questions');
      } catch (err: any) {
        setBulkQuizError(err.message || "Invalid JSON format");
      }
    }
  };

  const handleGithubFetch = async () => {
    if (!githubUrl || !githubCourse) return;
    setIsFetching(true);
    setGithubError('');
    try {
      const note = await fetchGitHubNote(githubUrl, githubCourse);
      note.date = new Date().toISOString();
      note.label = determineNoteLabel(note.body || '');
      setFetchedNote(note);
    } catch (err: any) {
      setGithubError(err.message || 'Failed to fetch GitHub note.');
      setFetchedNote(null);
    } finally {
      setIsFetching(false);
    }
  };

  const saveGithubNote = () => {
    if (!fetchedNote) return;
    saveCustomNote(fetchedNote);
    router.push('/notes');
  };

  const updateQuizOption = (index: number, value: string) => {
    const newOptions = [...quizOptions];
    newOptions[index] = value;
    setQuizOptions(newOptions);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Upload & Create</h1>
        <p className="text-gray-400 text-sm mt-1">
          Add personal study notes, bytes, quizzes, or import resources from GitHub. Local data is saved to your browser.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-dark-400/50 pb-px scrollbar-hide">
        <button
          onClick={() => setActiveTab('note')}
          className={`py-3 px-4 sm:px-6 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'note' ? 'border-accent-purple text-accent-purple-light' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📝 Markdown Note
        </button>
        <button
          onClick={() => setActiveTab('byte')}
          className={`py-3 px-4 sm:px-6 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'byte' ? 'border-accent-cyan text-accent-cyan-light' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          ⚡ Learning Byte
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`py-3 px-4 sm:px-6 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'quiz' ? 'border-accent-purple text-accent-purple-light' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          ❓ Multiple Choice Quiz
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`py-3 px-4 sm:px-6 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'github' ? 'border-accent-purple text-accent-purple-light' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          🐱 GitHub Import
        </button>
      </div>

      {/* Tab Content */}
      <div className="card p-6 sm:p-8">
        
        {/* --- Note Tab --- */}
        {activeTab === 'note' && (
          <form onSubmit={handleNoteSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures"
                  value={noteCourse}
                  onChange={(e) => setNoteCourse(e.target.value)}
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Binary Search Trees"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Label</label>
                <select
                  value={noteLabel}
                  onChange={(e) => setNoteLabel(e.target.value)}
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                >
                  <option value="Auto">Auto-assign</option>
                  <option value="Course Material">Course Material</option>
                  <option value="Syllabus">Syllabus</option>
                  <option value="Short Note">Short Note</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Markdown Body</label>
                <button
                  type="button"
                  onClick={() => setNotePreview(!notePreview)}
                  className="text-xs text-accent-purple-light hover:underline"
                >
                  {notePreview ? 'Edit Markdown' : 'Preview Markdown'}
                </button>
              </div>
              
              {notePreview ? (
                <div className="prose prose-invert prose-purple max-w-none p-4 rounded-lg bg-dark-600/50 border border-dark-400/30 min-h-[200px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {noteBody || '*No content to preview*'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  required
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Write your note down in markdown..."
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-3 text-sm text-white focus:border-accent-purple outline-none min-h-[200px] font-mono resize-y"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.png"
                  value={noteImage}
                  onChange={(e) => setNoteImage(e.target.value)}
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cloud Link (Optional)</label>
                <input
                  type="url"
                  placeholder="Google Drive, OneDrive link"
                  value={noteLink}
                  onChange={(e) => setNoteLink(e.target.value)}
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3">
              Save Local Note
            </button>
          </form>
        )}

        {/* --- Byte Tab --- */}
        {activeTab === 'byte' && (
          <form onSubmit={handleByteSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">Topic Designator</label>
                 <input
                   type="text"
                   required
                   placeholder="e.g. Operating Systems"
                   value={byteTopic}
                   onChange={(e) => setByteTopic(e.target.value)}
                   className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-cyan outline-none"
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">Byte Title</label>
                 <input
                   type="text"
                   required
                   placeholder="e.g. Context Switching Context"
                   value={byteTitle}
                   onChange={(e) => setByteTitle(e.target.value)}
                   className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-cyan outline-none"
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content (Markdown)</label>
              <textarea
                required
                value={byteContent}
                onChange={(e) => setByteContent(e.target.value)}
                placeholder="Write bite-sized content here..."
                className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-3 text-sm text-white focus:border-accent-cyan outline-none min-h-[150px] font-mono resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">Image URL (Optional)</label>
                 <input
                   type="url"
                   placeholder="https://example.com/diagram.png"
                   value={byteImage}
                   onChange={(e) => setByteImage(e.target.value)}
                   className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-cyan outline-none"
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">Video URL (Optional)</label>
                 <input
                   type="url"
                   placeholder="YouTube URL"
                   value={byteVideo}
                   onChange={(e) => setByteVideo(e.target.value)}
                   className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-cyan outline-none"
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Related Question IDs (Comma-separated)</label>
              <input
                type="text"
                placeholder="q_id_1, q_id_2"
                value={byteQuestions}
                onChange={(e) => setByteQuestions(e.target.value)}
                className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-cyan outline-none font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Found in the Question object definition. These will render as actionable quizzes.</p>
            </div>

            <button type="submit" className="w-full py-3 bg-accent-cyan hover:bg-accent-cyan-light text-dark-900 font-bold rounded-xl transition-all shadow-glow-cyan active:scale-[0.98]">
              Create Learning Byte
            </button>
          </form>
        )}

        {/* --- Quiz Tab --- */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <div className="flex p-1 bg-dark-600/50 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setQuizMode('single')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${quizMode === 'single' ? 'bg-dark-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                Single Entry
              </button>
              <button
                type="button"
                onClick={() => setQuizMode('bulk')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${quizMode === 'bulk' ? 'bg-dark-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                JSON Bulk Import
              </button>
            </div>

            <form onSubmit={handleQuizSubmit} className="space-y-6">
              {quizMode === 'single' ? (
                <>
                  {/* Single entry fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Question</label>
                    <textarea
                      required
                      value={quizQuestion}
                      onChange={(e) => setQuizQuestion(e.target.value)}
                      placeholder="What is the time complexity of a Binary Search?"
                      className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-3 text-sm text-white focus:border-accent-purple outline-none resize-y"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Options (A, B, C, D)</label>
                    {['A', 'B', 'C', 'D'].map((letter, index) => (
                      <div key={letter} className="flex gap-3 items-center">
                        <span className="w-8 h-8 rounded-lg bg-dark-500 text-gray-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          required
                          value={quizOptions[index]}
                          onChange={(e) => updateQuizOption(index, e.target.value)}
                          placeholder={`Option ${letter}`}
                          className="flex-1 bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                        />
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={quizAnswer === letter}
                          onChange={() => setQuizAnswer(letter)}
                          className="w-4 h-4 text-accent-purple focus:ring-accent-purple bg-dark-600 border-dark-400"
                        />
                        <span className="text-xs text-gray-500">Correct</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
                      <input
                        type="text"
                        required
                        placeholder="Algorithms"
                        value={quizTopic}
                        onChange={(e) => setQuizTopic(e.target.value)}
                        className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                      <select
                        value={quizSource}
                        onChange={(e) => setQuizSource(e.target.value)}
                        className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple outline-none"
                      >
                        <option value="Archived Exams">Archived Exams</option>
                        <option value="Course Notes">Course Notes</option>
                        <option value="Global">Global</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                      <select
                        value={quizDifficulty}
                        onChange={(e: any) => setQuizDifficulty(e.target.value)}
                        className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Hint (Optional)</label>
                    <input
                      type="text"
                      placeholder="A helpful nudge in the right direction..."
                      value={quizHint}
                      onChange={(e) => setQuizHint(e.target.value)}
                      className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Bulk Input Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Paste JSON Array of Questions</label>
                    <textarea
                      required
                      value={bulkQuizJson}
                      onChange={(e) => setBulkQuizJson(e.target.value)}
                      placeholder={'[\n  {\n    "question": "Sample?",\n    "options": ["O1", "O2", "O3", "O4"],\n    "answer": "O1",\n    "topic": "Algo",\n    "difficulty": "easy",\n    "explanation": "Here is why."\n  }\n]'}
                      className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-3 text-sm text-white focus:border-accent-purple outline-none min-h-[300px] font-mono whitespace-pre"
                    />
                    {bulkQuizError && (
                      <p className="text-red-400 text-sm mt-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        Error: {bulkQuizError}
                      </p>
                    )}
                  </div>
                </>
              )}

              <button type="submit" className="btn-primary w-full py-3">
                {quizMode === 'single' ? 'Save Custom Quiz' : 'Import Bulk Questions'}
              </button>
            </form>
          </div>
        )}

        {/* --- GitHub Tab --- */}
        {activeTab === 'github' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Raw Markdown URL</label>
                <input
                  type="url"
                  placeholder="https://raw.githubusercontent.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Course Target</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems"
                  value={githubCourse}
                  onChange={(e) => setGithubCourse(e.target.value)}
                  className="w-full bg-dark-600 border border-dark-400/50 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-purple outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleGithubFetch} 
              disabled={!githubUrl || !githubCourse || isFetching}
              className="btn-secondary w-full py-3 disabled:opacity-50"
            >
              {isFetching ? 'Fetching from GitHub...' : 'Fetch Markdown'}
            </button>

            {githubError && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                Error: {githubError}
              </div>
            )}

            {fetchedNote && (
              <div className="mt-8 border-t border-dark-400/50 pt-6 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Preview: {fetchedNote.title}</h3>
                  <div className="flex gap-2">
                    <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs text-nowrap">
                      GitHub Imported
                    </span>
                    <span className="badge bg-dark-500 text-gray-300 border border-dark-400 text-xs">
                      {fetchedNote.label}
                    </span>
                  </div>
                </div>
                
                <div className="prose prose-invert prose-purple max-w-none p-4 rounded-lg bg-dark-600/30 border border-dark-400/20 mb-6 max-h-96 overflow-y-auto text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {fetchedNote.body || ''}
                  </ReactMarkdown>
                </div>

                <button onClick={saveGithubNote} className="btn-primary w-full py-3">
                  Save Auto-Labeled Note to Local Storage
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
