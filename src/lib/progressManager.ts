export interface ProgressState {
  answeredQuestions: Record<string, boolean>;
  correctAnswers: Record<string, boolean>;
  xp: number;
  streak: number;
  accuracyByTopic: Record<string, number>;
  lastActiveDate: string;
  lastTopic: string;
  completedNotes: Record<string, boolean>;
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
  completedNotes: {},
};

function isValidProgress(data: unknown): data is ProgressState {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.answeredQuestions === 'object' &&
    typeof d.correctAnswers === 'object' &&
    typeof d.xp === 'number' &&
    typeof d.streak === 'number' &&
    typeof d.accuracyByTopic === 'object' &&
    typeof d.completedNotes === 'object'
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

    if (!parsed.completedNotes) parsed.completedNotes = {};
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

export function recordNoteCompleted(noteId: string): void {
  const state = getProgress();
  if (!state.completedNotes[noteId]) {
    state.completedNotes[noteId] = true;
    state.xp += 5; // Give some minor XP for reading a note
    saveProgress(state);
  }
}

export function getCompletedNotesCount(): number {
  const state = getProgress();
  return Object.keys(state.completedNotes || {}).length;
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

// ============================================================
// Supabase Sync Layer
// ============================================================
import {
  getRemoteProgress,
  saveRemoteProgress,
  deleteRemoteProgress,
  mergeProgress,
} from './supabaseProgress';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

type SyncCallback = (status: 'syncing' | 'synced' | 'error') => void;
let syncStatusCallback: SyncCallback | null = null;

export function onSyncStatus(cb: SyncCallback | null) {
  syncStatusCallback = cb;
}

/**
 * Debounced save to Supabase (2 second delay).
 * Call this after every local progress update when user is logged in.
 */
export function syncProgressToRemote(userId: string): void {
  if (syncTimer) clearTimeout(syncTimer);

  syncTimer = setTimeout(async () => {
    if (isSyncing) return;
    isSyncing = true;
    syncStatusCallback?.('syncing');

    try {
      const localProgress = getProgress();
      const success = await saveRemoteProgress(userId, localProgress);
      syncStatusCallback?.(success ? 'synced' : 'error');
    } catch (err) {
      console.error('Sync failed:', err);
      syncStatusCallback?.('error');
    } finally {
      isSyncing = false;
    }
  }, 2000);
}

/**
 * Full sync on login: fetch remote → merge with local → save both.
 */
export async function syncOnLogin(userId: string): Promise<ProgressState> {
  syncStatusCallback?.('syncing');

  try {
    const local = getProgress();
    const remote = await getRemoteProgress(userId);

    if (!remote) {
      // No remote data yet — push local to remote
      await saveRemoteProgress(userId, local);
      syncStatusCallback?.('synced');
      return local;
    }

    // Merge
    const merged = mergeProgress(local, remote);

    // Save merged result to both
    saveProgress(merged);
    await saveRemoteProgress(userId, merged);

    syncStatusCallback?.('synced');
    return merged;
  } catch (err) {
    console.error('Sync on login failed:', err);
    syncStatusCallback?.('error');
    return getProgress();
  }
}

/**
 * Reset remote progress (called when user resets progress while logged in).
 */
export async function resetRemoteProgress(userId: string): Promise<void> {
  await deleteRemoteProgress(userId);
}
