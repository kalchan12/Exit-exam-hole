export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'past_exam' | 'resource' | 'online' | 'Archived Exams' | 'Course Notes' | 'Global' | string;
  hint?: string; // Optional hint for questions
}

export interface Note {
  id: string;
  topic: string; // Used interchangeably with course
  course?: string;
  title: string;
  summary?: string; // Optional for backward compatibility with v1
  key_points?: string[]; // Optional for backward compatibility
  body?: string; // Markdown content
  images?: string[]; // Optional image URLs
  source?: 'Local' | 'GitHub' | 'Cloud' | 'system'; // Origin of the note
  links?: string[]; // Downloadable files or external links
  date?: string; // ISO date string
  label?: 'Course Material' | 'Syllabus' | 'Short Note' | string;
}

export interface Byte {
  id: string;
  topic: string;
  title: string;
  content: string; // Textual content
  images?: string[]; // Embedded images/vectors
  videoUrl?: string; // Embedded video
  relatedQuestionIds?: string[]; // References to Questions
  date?: string; // ISO date string
  source?: 'Local' | 'system';
}

export type Topic = string;

// In-memory cache
let questionsCache: Question[] | null = null;
let notesCache: Note[] | null = null;
let bytesCache: Byte[] | null = null;

const LOCAL_STORAGE_NOTES_KEY = 'cs_prep_custom_notes';
const LOCAL_STORAGE_QUESTIONS_KEY = 'cs_prep_custom_questions';
const LOCAL_STORAGE_BYTES_KEY = 'cs_prep_custom_bytes';

function getCustomNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse custom notes:', error);
    return [];
  }
}

function getCustomQuestions(): Question[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse custom questions:', error);
    return [];
  }
}

function getCustomBytes(): Byte[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_BYTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse custom bytes:', error);
    return [];
  }
}

export function saveCustomNote(note: Note) {
  const current = getCustomNotes();
  const updated = [...current.filter(n => n.id !== note.id), note];
  localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(updated));
  notesCache = null; // Invalidate cache
}

export function saveCustomByte(byte: Byte) {
  const current = getCustomBytes();
  const updated = [...current.filter(b => b.id !== byte.id), byte];
  localStorage.setItem(LOCAL_STORAGE_BYTES_KEY, JSON.stringify(updated));
  bytesCache = null; // Invalidate cache
}

export function saveCustomQuestion(question: Question) {
  const current = getCustomQuestions();
  const updated = [...current.filter(q => q.id !== question.id), question];
  localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(updated));
  questionsCache = null; // Invalidate cache
}

export async function getQuestions(): Promise<Question[]> {
  if (questionsCache) return questionsCache;

  try {
    const res = await fetch('/data/questions.json');
    const systemData: Question[] = await res.json();
    const customData = getCustomQuestions();
    const merged = [...systemData, ...customData];
    questionsCache = merged;
    return merged;
  } catch (error) {
    console.error('Failed to load questions:', error);
    const customData = getCustomQuestions();
    return customData;
  }
}

export async function getNotes(): Promise<Note[]> {
  if (notesCache) return notesCache;

  try {
    const res = await fetch('/data/notes.json');
    if (!res.ok) throw new Error('Failed to fetch notes.json');
    const systemData: Note[] = await res.json();
    const customData = getCustomNotes();
    const merged = [...systemData.map(n => ({...n, source: 'system' as const})), ...customData];
    notesCache = merged;
    return merged;
  } catch (error) {
    console.warn('Failed to load system notes, continuing with custom notes only:', error);
    const customData = getCustomNotes();
    return customData;
  }
}

export async function getBytes(): Promise<Byte[]> {
  if (bytesCache) return bytesCache;

  try {
    const res = await fetch('/data/bytes.json');
    if (!res.ok) throw new Error('Failed to fetch bytes.json');
    const systemData: Byte[] = await res.json();
    const customData = getCustomBytes();
    const merged = [...systemData.map(b => ({...b, source: 'system' as const})), ...customData];
    bytesCache = merged;
    return merged;
  } catch (error) {
    console.warn('Failed to load system bytes, continuing with custom bytes only:', error);
    const customData = getCustomBytes();
    return customData;
  }
}

export async function getTopics(): Promise<Topic[]> {
  const questions = await getQuestions();
  const topicSet = new Set(questions.map((q) => q.topic));
  return Array.from(topicSet).sort();
}

export async function getQuestionsByFilter(filters: {
  topic?: string;
  difficulty?: string;
  source?: string;
}): Promise<Question[]> {
  let questions = await getQuestions();

  if (filters.topic && filters.topic !== 'all') {
    questions = questions.filter((q) => q.topic === filters.topic);
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    questions = questions.filter((q) => q.difficulty === filters.difficulty);
  }
  if (filters.source && filters.source !== 'all') {
    questions = questions.filter((q) => q.source === filters.source);
  }

  return questions;
}

export async function getRandomQuestions(count: number): Promise<Question[]> {
  const questions = await getQuestions();
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function getNotesByTopic(topic: string): Promise<Note[]> {
  const notes = await getNotes();
  if (topic === 'all') return notes;
  return notes.filter((n) => n.topic === topic);
}

export async function getBytesByTopic(topic: string): Promise<Byte[]> {
  const bytes = await getBytes();
  if (topic === 'all') return bytes;
  return bytes.filter((b) => b.topic === topic);
}
