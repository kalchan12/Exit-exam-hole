import { supabase } from './supabaseClient';

// ─── Types ───

export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  created_at?: string;
}

export interface Note {
  id: string;
  topic: string; 
  course?: string;
  title: string;
  summary?: string;
  key_points?: string[];
  body?: string; 
  images?: string[]; 
  source?: 'Local' | 'GitHub' | 'Cloud' | 'system' | string;
  links?: string[]; 
  date?: string; 
  label?: 'Course Material' | 'Syllabus' | 'Short Note' | string;
  major?: 'CSE' | 'Software' | 'Both';
  githubUrl?: string;
}

export interface Byte {
  id: string;
  topic: string;
  title: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  relatedQuestionIds?: string[];
  date?: string;
  source?: 'Local' | 'GitHub' | 'Cloud' | 'system';
  major?: 'CSE' | 'Software' | 'Both';
  githubUrl?: string;
}

export type Topic = string;

// ─── Cache ───

let questionsCache: Question[] | null = null;
let notesCache: Note[] | null = null;
let bytesCache: Byte[] | null = null;

const LOCAL_STORAGE_NOTES_KEY = 'cs_prep_custom_notes';
const LOCAL_STORAGE_BYTES_KEY = 'cs_prep_custom_bytes';

// ─── Questions (Supabase ONLY) ───

export function invalidateQuestionsCache() {
  questionsCache = null;
}

export async function getQuestions(): Promise<Question[]> {
  if (questionsCache) return questionsCache;

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*');

    if (error) {
      console.error('Failed to load questions from Supabase:', error.message, error.details, error.hint);
      return [];
    }

    questionsCache = (data || []).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation || '',
      topic: q.topic,
      difficulty: q.difficulty || 'medium',
      source: q.source || 'Manual',
      created_at: q.created_at,
    }));

    return questionsCache;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}

export async function getTopics(): Promise<Topic[]> {
  const questions = await getQuestions();
  const topicSet = new Set(questions.map(q => q.topic));
  return Array.from(topicSet).sort();
}

export async function getQuestionsByFilter(filters: {
  topic?: string;
  difficulty?: string;
  source?: string;
}): Promise<Question[]> {
  let questions = await getQuestions();

  if (filters.topic && filters.topic !== 'all') {
    questions = questions.filter(q => q.topic === filters.topic);
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === filters.difficulty);
  }
  if (filters.source && filters.source !== 'all') {
    questions = questions.filter(q => q.source === filters.source);
  }

  return questions;
}

export async function getRandomQuestions(count: number): Promise<Question[]> {
  const questions = await getQuestions();
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Notes (Supabase + localStorage + static, unchanged) ───

function getCustomNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function getCustomBytes(): Byte[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_BYTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveCustomNote(note: Note) {
  const current = getCustomNotes();
  const updated = [...current.filter(n => n.id !== note.id), note];
  localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(updated));
  notesCache = null;
}

export function saveCustomByte(byte: Byte) {
  const current = getCustomBytes();
  const updated = [...current.filter(b => b.id !== byte.id), byte];
  localStorage.setItem(LOCAL_STORAGE_BYTES_KEY, JSON.stringify(updated));
  bytesCache = null;
}

export function deleteCustomNote(noteId: string) {
  const current = getCustomNotes();
  const updated = current.filter(n => n.id !== noteId);
  localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(updated));
  notesCache = null;
}

export function deleteCustomByte(byteId: string) {
  const current = getCustomBytes();
  const updated = current.filter(b => b.id !== byteId);
  localStorage.setItem(LOCAL_STORAGE_BYTES_KEY, JSON.stringify(updated));
  bytesCache = null;
}

export function invalidateNotesCache() { notesCache = null; }
export function invalidateBytesCache() { bytesCache = null; }

export async function getNotes(): Promise<Note[]> {
  if (notesCache) return notesCache;

  try {
    const res = await fetch('/data/notes.json');
    if (!res.ok) throw new Error('Failed to fetch notes.json');
    const systemData: Note[] = await res.json();
    const customData = getCustomNotes();

    let supabaseData: Note[] = [];
    const { data, error } = await supabase.from('notes').select('*');
    if (!error && data) {
      supabaseData = data.map(n => ({
        ...n,
        githubUrl: n.github_url,
      }));
    }

    const merged = [
      ...systemData.map(n => ({ ...n, source: 'system' as const })),
      ...customData,
      ...supabaseData,
    ];
    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
    notesCache = unique;
    return unique;
  } catch (error) {
    console.warn('Failed to load system notes:', error);
    return getCustomNotes();
  }
}

export async function getBytes(): Promise<Byte[]> {
  if (bytesCache) return bytesCache;

  try {
    const res = await fetch('/data/bytes.json');
    if (!res.ok) throw new Error('Failed to fetch bytes.json');
    const systemData: Byte[] = await res.json();
    const customData = getCustomBytes();

    let supabaseData: Byte[] = [];
    const { data, error } = await supabase.from('bytes').select('*');
    if (!error && data) {
      supabaseData = data.map(b => ({
        ...b,
        videoUrl: b.video_url,
        relatedQuestionIds: b.related_question_ids,
        githubUrl: b.github_url,
      }));
    }

    const merged = [
      ...systemData.map(b => ({ ...b, source: 'system' as const })),
      ...customData,
      ...supabaseData,
    ];
    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
    bytesCache = unique;
    return unique;
  } catch (error) {
    console.warn('Failed to load system bytes:', error);
    return getCustomBytes();
  }
}

export async function getNotesByTopic(topic: string): Promise<Note[]> {
  const notes = await getNotes();
  if (topic === 'all') return notes;
  return notes.filter(n => n.topic === topic);
}

export async function getBytesByTopic(topic: string): Promise<Byte[]> {
  const bytes = await getBytes();
  if (topic === 'all') return bytes;
  return bytes.filter(b => b.topic === topic);
}
