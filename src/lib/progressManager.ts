export interface ProgressState {
  answeredQuestions: Record<string, boolean>;
  correctAnswers: Record<string, boolean>;
  xp: number;
  streak: number;
  accuracyByTopic: Record<string, number>;
  lastActiveDate: string;
  lastTopic: string;
}

const STORAGE_KEY = 'cs_exam_prep_progress';

const defaultState: ProgressState = {
  answeredQuestions: {},
  correctAnswers: {},
  xp: 0,
  streak: 0,
  accuracyByTopic: {},
  lastActiveDate: '',
  lastTopic: '',
};

function isValidProgress(data: unknown): data is ProgressState {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.answeredQuestions === 'object' &&
    typeof d.correctAnswers === 'object' &&
    typeof d.xp === 'number' &&
    typeof d.streak === 'number' &&
    typeof d.accuracyByTopic === 'object'
  );
}

export function getProgress(): ProgressState {
  if (typeof window === 'undefined') return { ...defaultState };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };

    const parsed = JSON.parse(raw);
    if (!isValidProgress(parsed)) {
      console.warn('Corrupted progress data, resetting...');
      localStorage.removeItem(STORAGE_KEY);
      return { ...defaultState };
    }

    return parsed;
  } catch {
    console.warn('Failed to read progress, resetting...');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    return { ...defaultState };
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

export function recordAnswer(
  questionId: string,
  isCorrect: boolean,
  topic: string
): ProgressState {
  const state = getProgress();

  state.answeredQuestions[questionId] = true;
  state.correctAnswers[questionId] = isCorrect;

  if (isCorrect) {
    state.xp += 10;
    state.streak += 1;
  } else {
    state.streak = 0;
  }

  // Recalculate topic accuracy
  const topicQuestionIds = Object.keys(state.answeredQuestions).filter(
    (id) => {
      // We'll store topic mapping locally
      return true; // Will be refined in gamification
    }
  );

  state.lastActiveDate = new Date().toISOString().split('T')[0];
  state.lastTopic = topic;

  saveProgress(state);
  return state;
}

export function getAnsweredCount(): number {
  const state = getProgress();
  return Object.keys(state.answeredQuestions).length;
}

export function getCorrectCount(): number {
  const state = getProgress();
  return Object.values(state.correctAnswers).filter(Boolean).length;
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

// Theme persistence
const THEME_KEY = 'cs_exam_prep_theme';

export function getTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  try {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
  } catch {
    return 'dark';
  }
}

export function setTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch { /* ignore */ }
}
