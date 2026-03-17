export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'past_exam' | 'resource' | 'online';
}

export interface Note {
  id: string;
  topic: string;
  title: string;
  summary: string;
  key_points: string[];
}

export type Topic = string;

// In-memory cache
let questionsCache: Question[] | null = null;
let notesCache: Note[] | null = null;

export async function getQuestions(): Promise<Question[]> {
  if (questionsCache) return questionsCache;

  try {
    const res = await fetch('/data/questions.json');
    const data: Question[] = await res.json();
    questionsCache = data;
    return data;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}

export async function getNotes(): Promise<Note[]> {
  if (notesCache) return notesCache;

  try {
    const res = await fetch('/data/notes.json');
    const data: Note[] = await res.json();
    notesCache = data;
    return data;
  } catch (error) {
    console.error('Failed to load notes:', error);
    return [];
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
