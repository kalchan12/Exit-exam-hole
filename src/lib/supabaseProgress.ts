import { supabase } from './supabaseClient';
import type { ProgressState } from './progressManager';

interface RemoteProgressRow {
  id: string;
  user_id: string;
  xp: number;
  streak: number;
  answered: Record<string, boolean>;
  correct: Record<string, boolean>;
  accuracy: Record<string, number>;
  last_active_date: string;
  last_topic: string;
  updated_at: string;
}

export async function getRemoteProgress(userId: string): Promise<ProgressState | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  const row = data as RemoteProgressRow;
  return {
    answeredQuestions: row.answered || {},
    correctAnswers: row.correct || {},
    xp: row.xp || 0,
    streak: row.streak || 0,
    accuracyByTopic: row.accuracy || {},
    lastActiveDate: row.last_active_date || '',
    lastTopic: row.last_topic || '',
    completedNotes: {},
  };
}

export async function saveRemoteProgress(
  userId: string,
  progress: ProgressState
): Promise<boolean> {
  const { error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        xp: progress.xp,
        streak: progress.streak,
        answered: progress.answeredQuestions,
        correct: progress.correctAnswers,
        accuracy: progress.accuracyByTopic,
        last_active_date: progress.lastActiveDate,
        last_topic: progress.lastTopic,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Failed to save remote progress:', error.message);
    return false;
  }
  return true;
}

export async function deleteRemoteProgress(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_progress')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to delete remote progress:', error.message);
    return false;
  }
  return true;
}

/**
 * Smart merge: combine local and remote progress, keeping the best of both.
 */
export function mergeProgress(
  local: ProgressState,
  remote: ProgressState
): ProgressState {
  // Union of answered questions
  const answeredQuestions: Record<string, boolean> = {
    ...remote.answeredQuestions,
    ...local.answeredQuestions,
  };

  // Union of correct answers (local takes precedence for conflicts)
  const correctAnswers: Record<string, boolean> = {
    ...remote.correctAnswers,
    ...local.correctAnswers,
  };

  // Merge accuracy by topic: average where both exist, otherwise take whichever has it
  const allTopics = new Set([
    ...Object.keys(local.accuracyByTopic),
    ...Object.keys(remote.accuracyByTopic),
  ]);
  const accuracyByTopic: Record<string, number> = {};
  for (const topic of allTopics) {
    const localAcc = local.accuracyByTopic[topic];
    const remoteAcc = remote.accuracyByTopic[topic];
    if (localAcc !== undefined && remoteAcc !== undefined) {
      accuracyByTopic[topic] = Math.round((localAcc + remoteAcc) / 2);
    } else {
      accuracyByTopic[topic] = localAcc ?? remoteAcc;
    }
  }

  return {
    answeredQuestions,
    correctAnswers,
    xp: Math.max(local.xp, remote.xp),
    streak: Math.max(local.streak, remote.streak),
    accuracyByTopic,
    lastActiveDate:
      local.lastActiveDate > remote.lastActiveDate
        ? local.lastActiveDate
        : remote.lastActiveDate,
    lastTopic: local.lastTopic || remote.lastTopic,
    completedNotes: local.completedNotes || {},
  };
}
