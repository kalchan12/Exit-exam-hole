'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveCustomNote, saveCustomQuestion, type Note, type Question } from '@/lib/dataLoader';
import { fetchGitHubNote } from '@/lib/githubFetcher';

type Tab = 'note' | 'quiz' | 'github';

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('note');
  
  // Note State
  const [noteCourse, setNoteCourse] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteImage, setNoteImage] = useState('');
  const [noteLink, setNoteLink] = useState('');
  const [notePreview, setNotePreview] = useState(false);

  // Quiz State
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [quizAnswer, setQuizAnswer] = useState('A');
  const [quizHint, setQuizHint] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizSource, setQuizSource] = useState('Course Notes');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // GitHub State
  const [githubUrl, setGithubUrl] = useState('');
  const [githubCourse, setGithubCourse] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [fetchedNote, setFetchedNote] = useState<Note | null>(null);

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteCourse || !noteTitle || !noteBody) return;

    const newNote: Note = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      topic: noteCourse,
      course: noteCourse,
      title: noteTitle,
      body: noteBody,
      source: 'Local',
      images: noteImage ? [noteImage] : [],
      links: noteLink ? [noteLink] : [],
    };

    saveCustomNote(newNote);
    router.push('/notes');
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizQuestion || quizOptions.some(o => !o) || !quizTopic) return;

    const newQuiz: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      question: quizQuestion,
      options: quizOptions,
      answer: quizOptions[quizAnswer.charCodeAt(0) - 65], // Maps 'A' to 0, 'B' to 1, etc.
      explanation: quizHint || 'Custom user question.', 
      hint: quizHint,
      topic: quizTopic,
      difficulty: quizDifficulty,
      source: quizSource,
    };

    saveCustomQuestion(newQuiz);
    router.push('/questions');
  };

  const handleGithubFetch = async () => {
    if (!githubUrl || !githubCourse) return;
    setIsFetching(true);
    setGithubError('');
    try {
      const note = await fetchGitHubNote(githubUrl, githubCourse);
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
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Upload & Create</h1>
        <p className="text-gray-400 text-sm mt-1">
          Add personal study notes, quizzes, or import resources from GitHub. Local data is saved to your browser.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* --- Quiz Tab --- */}
        {activeTab === 'quiz' && (
          <form onSubmit={handleQuizSubmit} className="space-y-6">
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

            <button type="submit" className="btn-primary w-full py-3">
              Save Custom Quiz
            </button>
          </form>
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
                  <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs text-nowrap">
                    GitHub Imported
                  </span>
                </div>
                
                <div className="prose prose-invert prose-purple max-w-none p-4 rounded-lg bg-dark-600/30 border border-dark-400/20 mb-6 max-h-96 overflow-y-auto text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {fetchedNote.body || ''}
                  </ReactMarkdown>
                </div>

                <button onClick={saveGithubNote} className="btn-primary w-full py-3">
                  Save GitHub Note to Local Storage
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
