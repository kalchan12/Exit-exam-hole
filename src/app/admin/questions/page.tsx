'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/components/AuthProvider';
import { getQuestions, invalidateQuestionsCache, type Question } from '@/lib/dataLoader';
import { saveQuestionToSupabase, updateQuestionInSupabase, deleteQuestionFromSupabase, deleteTopicQuestions } from '@/lib/supabaseLoader';

type Tab = 'add' | 'list' | 'bulk';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('add');

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [source, setSource] = useState('Manual');

  // List state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  // Edit state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Bulk state
  const [bulkJson, setBulkJson] = useState('');
  const [bulkSource, setBulkSource] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const resetForm = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setExplanation('');
    setTopic('');
    setDifficulty('medium');
    setSource('Manual');
    setEditingQuestion(null);
    setShowPreview(false);
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || options.some(o => !o.trim()) || !topic.trim()) {
      showFeedback('error', 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const id = editingQuestion?.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const qData = {
        id,
        question: questionText.trim(),
        options: options.map(o => o.trim()),
        answer: options[correctAnswer].trim(),
        explanation: explanation.trim(),
        topic: topic.trim(),
        difficulty,
        source: source.trim() || 'Manual',
      };

      let success: boolean;
      if (editingQuestion) {
        success = await updateQuestionInSupabase(id, qData);
      } else {
        success = await saveQuestionToSupabase(qData);
      }

      if (success) {
        showFeedback('success', editingQuestion ? 'Question updated!' : 'Question added!');
        resetForm();
        await loadQuestions();
      } else {
        showFeedback('error', 'Failed to save. Check console for details.');
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setIsSaving(false);
    }
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
    setSource(q.source || 'Manual');
    setTab('add');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question permanently?')) return;
    const success = await deleteQuestionFromSupabase(id);
    if (success) {
      showFeedback('success', 'Question deleted.');
      await loadQuestions();
    } else {
      showFeedback('error', 'Failed to delete.');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkJson.trim() || !bulkSource.trim()) {
      showFeedback('error', 'Please provide JSON and a source name.');
      return;
    }
    setIsSaving(true);
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of questions.');

      let successCount = 0;
      let errorCount = 0;

      for (const q of parsed) {
        if (!q.id || !q.question || !q.options || !q.answer || !q.topic) {
          errorCount++;
          continue;
        }
        const success = await saveQuestionToSupabase({
          id: q.id,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation || '',
          topic: q.topic,
          difficulty: q.difficulty || 'medium',
          source: bulkSource.trim(),
        });
        if (success) successCount++;
        else errorCount++;
      }

      showFeedback('success', `Imported ${successCount} questions. ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
      setBulkJson('');
      await loadQuestions();
    } catch (err: any) {
      showFeedback('error', `Invalid JSON: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering
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
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Question Manager</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase font-bold tracking-widest">
            {questions.length} questions in database
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['add', 'list', 'bulk'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t !== 'add') resetForm(); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              tab === t
                ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20'
                : 'bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500'
            }`}
          >
            {t === 'add' ? (editingQuestion ? '✏️ Edit' : '➕ Add') : t === 'list' ? '📋 List' : '📦 Bulk Import'}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-[11px] font-black uppercase tracking-widest ${
          feedback.type === 'success'
            ? 'bg-green-500/5 border-green-500/20 text-green-400'
            : 'bg-red-500/5 border-red-500/20 text-red-400'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* TAB: ADD / EDIT */}
      {tab === 'add' && (
        <form onSubmit={handleSubmit} className="glass-card p-8 border-white/5 space-y-6">
          {/* Question text */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                Question (Markdown supported)
              </label>
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
                className="modern-textarea min-h-[120px] font-mono text-xs"
                placeholder="What is the time complexity of binary search?"
                required
              />
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">
              Options (4 choices)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                    correctAnswer === i
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-dark-500 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    className="modern-input flex-1"
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Correct Answer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Correct Answer</label>
              <select value={correctAnswer} onChange={e => setCorrectAnswer(Number(e.target.value))} className="modern-input w-full">
                {options.map((opt, i) => (
                  <option key={i} value={i}>{String.fromCharCode(65 + i)}: {opt || '(empty)'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="modern-input w-full">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Source</label>
              <input type="text" value={source} onChange={e => setSource(e.target.value)} className="modern-input w-full" placeholder="Exit Exam 2017" />
            </div>
          </div>

          {/* Topic + Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Topic</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="modern-input w-full" placeholder="Algorithms" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Explanation (Markdown)</label>
              <textarea
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                className="modern-textarea min-h-[80px] font-mono text-xs"
                placeholder="Binary search divides the search interval in half..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 py-3 font-black uppercase italic tracking-widest disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
            </button>
            {editingQuestion && (
              <button type="button" onClick={resetForm} className="btn-secondary px-6 py-3 font-black uppercase text-xs">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* TAB: LIST */}
      {tab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="modern-input flex-1 min-w-[200px]"
              placeholder="Search questions..."
            />
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="modern-input"
            >
              <option value="all">All Sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
            Showing {filtered.length} of {questions.length} questions
          </p>

          {/* Questions */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filtered.map((q, idx) => (
              <div key={q.id} className="glass-card p-5 border-white/5 flex items-start gap-4 group hover:border-accent-purple/20 transition-all">
                <span className="text-gray-600 font-mono text-xs mt-1 shrink-0 w-8">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{q.question.substring(0, 120)}{q.question.length > 120 ? '...' : ''}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{q.topic}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-500 text-gray-400">{q.difficulty}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">{q.source}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => handleEdit(q)} className="text-xs text-accent-purple hover:text-white transition-colors p-2" title="Edit">✏️</button>
                  <button onClick={() => handleDelete(q.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors p-2" title="Delete">🗑️</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-gray-600 py-20">No questions found.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB: BULK IMPORT */}
      {tab === 'bulk' && (
        <div className="glass-card p-8 border-white/5 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Source Name</label>
            <input
              type="text"
              value={bulkSource}
              onChange={e => setBulkSource(e.target.value)}
              className="modern-input w-full"
              placeholder="Exit Exam 2017"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">
              JSON Array (paste your questions)
            </label>
            <textarea
              value={bulkJson}
              onChange={e => setBulkJson(e.target.value)}
              className="modern-textarea min-h-[300px] font-mono text-xs"
              placeholder={`[\n  {\n    "id": "q1",\n    "question": "What is...",\n    "options": ["A", "B", "C", "D"],\n    "answer": "A",\n    "explanation": "Because...",\n    "topic": "Algorithms",\n    "difficulty": "medium"\n  }\n]`}
              required
            />
          </div>
          <button
            onClick={handleBulkImport}
            disabled={isSaving}
            className="btn-primary w-full py-4 font-black uppercase italic tracking-widest disabled:opacity-50"
          >
            {isSaving ? 'Importing...' : `Import to "${bulkSource || '...'}"`}
          </button>
        </div>
      )}
    </div>
  );
}
