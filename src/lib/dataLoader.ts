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
  videoUrl?: string;
  videoUrls?: string[];
}

export interface Byte {
  id: string;
  topic: string; // The Subject/Course name
  sub_topic?: string; // The Sub-topic (e.g. Deadlock)
  title: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  videoUrls?: string[];
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
const LOCAL_STORAGE_COURSES_KEY = 'cs_prep_custom_courses';

export const DEFAULT_COURSES = [
  "Fundamentals of Programming",
  "Data Structures & Algorithms",
  "Object Oriented Programming",
  "Database Systems",
  "Fundamentals of Software Engineering",
  "Microcomputer & Interfacing",
  "Operating Systems",
  "Digital Logic Design",
  "Computer Architecture & Organization",
  "Data Communication and Computer Networks",
  "Computer Systems Security",
  "Distributed Systems",
  "Compiler Design",
  "Introduction to Artificial Intelligence"
];

// ─── Questions (Supabase ONLY) ───

// Department groupings for exam organization
export const DEPARTMENT_SOURCES: Record<string, string[]> = {
  "Accounting And Finance": [
    "Accounting And Finance 2015",
    "Accounting And Finance 2016",
    "Accounting And Finance 2017",
  ],
  "Adult Education And Community Development": [
    "Adult Education And Community Development 2015",
  ],
  "Afaan Oromo And Literature Exit Exam": [
    "Afaan Oromo And Literature Exit Exam 2015",
    "Afaan Oromo And Literature Exit Exam 2016",
  ],
  "Agricultural Economics": [
    "Agricultural Economics 2015",
    "Agricultural Economics 2016",
  ],
  "Amharic Language And Literature": [
    "Amharic Language And Literature 2015",
    "Amharic Language And Literature 2016",
  ],
  "Animal And Range Science": [
    "Animal And Range Science 2015",
    "Animal And Range Science 2016",
  ],
  "Architecture": [
    "Architecture 2015",
    "Architecture 2016",
  ],
  "Biology": [
    "Biology 2015",
    "Biology 2016",
  ],
  "Chemical Engineering": [
    "Chemical Engineering 2016",
  ],
  "Chemistry": [
    "Chemistry 2015",
    "Chemistry 2016",
  ],
  "Civil Engineering": [
    "Civil Engineering 2015",
    "Civil Engineering 2016",
  ],
  "Computer Science": [
    "Archived Exams",
    "Computer Science 2015",
    "Computer Science 2016",
    "Exit Exam 2015",
    "Exit Exam 2016 (Jan)",
    "Exit Exam 2017",
    "Exit Exam 2017 (Jan)",
    "Exit Exam 2018 (mid semester)",
  ],
  "Construction Technology And Management": [
    "Construction Technology And Management 2015",
    "Construction Technology And Management 2016",
  ],
  "Cooperative Business Management": [
    "Cooperative Business Management 2015",
  ],
  "Developmental Economics": [
    "Developmental Economics 2015",
    "Developmental Economics 2016",
  ],
  "Economics": [
    "Economics 2015",
    "Economics 2016",
  ],
  "Economics And Management": [
    "Economics And Management 2016",
  ],
  "Educational Planning And Management": [
    "Educational Planning And Management 2016",
  ],
  "Electrical And Computer Engineering": [
    "Electrical And Computer Engineering 2015",
    "Electrical And Computer Engineering 2016",
  ],
  "English": [
    "English 2015",
    "English 2016",
  ],
  "Environmental Science": [
    "Environmental Science 2015",
    "Environmental Science 2016",
  ],
  "Forestry": [
    "Forestry 2015",
    "Forestry 2016",
  ],
  "Geography And Environmental": [
    "Geography And Environmental 2015",
    "Geography And Environmental 2016",
  ],
  "History": [
    "History 2016",
  ],
  "Information Science": [
    "Information Science 2015",
    "Information Science 2016",
  ],
  "Information Systems": [
    "Information Systems 2015",
    "Information Systems 2016",
  ],
  "Information Technology": [
    "Information Technology 2015 Model",
    "Information Technology 2015",
    "Information Technology 2016 Model",
    "Information Technology 2016",
  ],
  "Journalism": [
    "Journalism 2015",
    "Journalism 2016",
  ],
  "Law": [
    "Law 2015",
    "Law 2016",
  ],
  "Life Long Learning And Community Development": [
    "Life Long Learning And Community Development 2015",
  ],
  "Management": [
    "Management 2015",
    "Management 2016",
  ],
  "Manufacturing Engineering": [
    "Manufacturing Engineering 2015",
    "Manufacturing Engineering 2016",
    "Manufacturing Engineering 2017",
  ],
  "Marketing Management": [
    "Marketing Management 2015",
    "Marketing Management 2016",
  ],
  "Mathematics": [
    "Mathematics 2015",
    "Mathematics 2016",
  ],
  "Mechanical Engineering": [
    "Mechanical Engineering 2015",
    "Mechanical Engineering 2016",
  ],
  "Natural Resource Management": [
    "Natural Resource Management 2015",
    "Natural Resource Management 2016",
  ],
  "Nursing": [
    "Nursing 2015 Model",
    "Nursing 2016 Model",
    "Nursing 2016",
  ],
  "Pharmacy": [
    "Pharmacy 2015",
    "Pharmacy 2016",
  ],
  "Physics": [
    "Physics 2015",
    "Physics 2016",
  ],
  "Plant Science": [
    "Plant Science 2015",
    "Plant Science 2016",
  ],
  "Psychology": [
    "Psychology 2015",
    "Psychology 2016",
  ],
  "Public Health Officer": [
    "Public Health Officer 2015",
    "Public Health Officer 2016",
  ],
  "Sociology": [
    "Sociology 2015",
    "Sociology 2016",
  ],
  "Software Engineering": [
    "Software Engineering 2015 Model",
    "Software Engineering 2015",
    "Software Engineering 2016 Model",
  ],
  "Sport Science": [
    "Sport Science 2015",
    "Sport Science 2016",
  ],
  "Statistics": [
    "Statistics 2015",
    "Statistics 2016",
  ],
  "Tourism And Hotel Management": [
    "Tourism And Hotel Management 2015",
    "Tourism And Hotel Management 2016",
  ],
  "Veterinary Medicine": [
    "Veterinary Medicine 2015",
    "Veterinary Medicine 2016",
  ],
  "Water Resource And Irrigation Engineering": [
    "Water Resource And Irrigation Engineering 2015",
  ],
};

export function getDepartmentFromSource(source: string): string {
  for (const [dept, sources] of Object.entries(DEPARTMENT_SOURCES)) {
    if (sources.includes(source)) return dept;
  }
  return 'Other';
}

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

export function getCustomCourses(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_COURSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function getCourses(): Promise<string[]> {
  let localFileCourses: string[] = [];
  try {
    const res = await fetch('/data/courses.json');
    if (res.ok) {
      localFileCourses = await res.json();
    }
  } catch (e) {
    // Ignore fetch error if file doesn't exist
  }

  let dbCourses: string[] = [];
  try {
    const { data, error } = await supabase.from('courses').select('name');
    if (!error && data) {
      dbCourses = data.map((c: any) => c.name);
    }
  } catch (e) {
    // Ignore database errors
  }

  const custom = getCustomCourses();
  const all = Array.from(new Set([...DEFAULT_COURSES, ...custom, ...localFileCourses, ...dbCourses]));
  return all.sort();
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

export function saveCustomCourse(courseName: string) {
  const current = getCustomCourses();
  if (!current.includes(courseName)) {
    const updated = [...current, courseName];
    localStorage.setItem(LOCAL_STORAGE_COURSES_KEY, JSON.stringify(updated));
  }
}

export function invalidateNotesCache() { notesCache = null; }
export function invalidateBytesCache() { bytesCache = null; }

export async function getNotes(): Promise<Note[]> {
  if (notesCache) return notesCache;

  let systemData: Note[] = [];
  try {
    const res = await fetch('/data/notes.json');
    if (res.ok) {
      systemData = await res.json();
    }
  } catch (error) {
    console.warn('Failed to fetch notes.json:', error);
  }

  const customData = getCustomNotes();

  let supabaseData: Note[] = [];
  try {
    const { data, error } = await supabase.from('notes').select('*');
    if (!error && data) {
      supabaseData = data.map(n => ({
        ...n,
        githubUrl: n.github_url,
        videoUrl: n.video_url,
        videoUrls: n.video_urls,
      }));
    } else if (error) {
      console.warn('Supabase notes error:', error.message);
    }
  } catch (dbErr) {
    console.warn('Supabase notes fetch crashed:', dbErr);
  }

  const merged = [
    ...systemData.map(n => ({ ...n, source: n.source || ('system' as const) })),
    ...customData,
    ...supabaseData,
  ];
  const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
  notesCache = unique;
  return unique;
}

export async function getBytes(): Promise<Byte[]> {
  if (bytesCache) return bytesCache;

  let systemData: Byte[] = [];
  try {
    const res = await fetch('/data/bytes.json');
    if (res.ok) {
      systemData = await res.json();
    }
  } catch (error) {
    console.warn('Failed to fetch bytes.json:', error);
  }

  const customData = getCustomBytes();

  let supabaseData: Byte[] = [];
  try {
    const { data, error } = await supabase.from('bytes').select('*');
    if (!error && data) {
      supabaseData = data.map(b => ({
        ...b,
        videoUrl: b.video_url,
        videoUrls: b.video_urls || (b.video_url ? [b.video_url] : []),
        relatedQuestionIds: b.related_question_ids,
        githubUrl: b.github_url,
        sub_topic: b.sub_topic,
      }));
    } else if (error) {
      console.warn('Supabase bytes error:', error.message);
    }
  } catch (dbErr) {
    console.warn('Supabase bytes fetch crashed:', dbErr);
  }

  const merged = [
    ...systemData.map(b => ({
      ...b,
      videoUrls: b.videoUrls || (b.videoUrl ? [b.videoUrl] : []),
      source: b.source || ('system' as const)
    })),
    ...customData.map(b => ({
      ...b,
      videoUrls: b.videoUrls || (b.videoUrl ? [b.videoUrl] : [])
    })),
    ...supabaseData,
  ];
  const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
  bytesCache = unique;
  return unique;
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
