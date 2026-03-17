import { getProgress, saveProgress, type ProgressState } from './progressManager';

export function calculateXP(state: ProgressState): number {
  return state.xp;
}

export function calculateStreak(state: ProgressState): number {
  return state.streak;
}

export function calculateTopicMastery(
  topic: string,
  answeredQuestions: Record<string, boolean>,
  correctAnswers: Record<string, boolean>,
  allQuestionTopics: Record<string, string>
): number {
  const topicQuestionIds = Object.keys(answeredQuestions).filter(
    (id) => allQuestionTopics[id] === topic
  );

  if (topicQuestionIds.length === 0) return 0;

  const correct = topicQuestionIds.filter((id) => correctAnswers[id]).length;
  return Math.round((correct / topicQuestionIds.length) * 100);
}

export function calculateOverallAccuracy(state: ProgressState): number {
  const total = Object.keys(state.answeredQuestions).length;
  if (total === 0) return 0;

  const correct = Object.values(state.correctAnswers).filter(Boolean).length;
  return Math.round((correct / total) * 100);
}

export function getWeakTopics(
  accuracyByTopic: Record<string, number>,
  threshold: number = 50
): string[] {
  return Object.entries(accuracyByTopic)
    .filter(([, accuracy]) => accuracy < threshold)
    .map(([topic]) => topic)
    .sort((a, b) => (accuracyByTopic[a] || 0) - (accuracyByTopic[b] || 0));
}

export function updateTopicAccuracy(
  topic: string,
  isCorrect: boolean
): Record<string, number> {
  const state = getProgress();

  // Count topic-specific stats from all answers
  // For simplicity, we track running accuracy
  const currentAccuracy = state.accuracyByTopic[topic] || 0;
  const topicAnswered = Object.keys(state.answeredQuestions).length;

  if (topicAnswered === 0) {
    state.accuracyByTopic[topic] = isCorrect ? 100 : 0;
  } else {
    // Weighted moving average
    const weight = 0.3;
    state.accuracyByTopic[topic] = Math.round(
      currentAccuracy * (1 - weight) + (isCorrect ? 100 : 0) * weight
    );
  }

  saveProgress(state);
  return state.accuracyByTopic;
}

export function getDailyChallenge(totalQuestions: number): number[] {
  // Generate consistent daily indices based on date
  const today = new Date().toISOString().split('T')[0];
  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed += today.charCodeAt(i);
  }

  const indices: number[] = [];
  const count = Math.min(5, totalQuestions);

  for (let i = 0; i < count; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    indices.push(seed % totalQuestions);
  }

  return Array.from(new Set(indices)); // Remove duplicates
}

export function getLevel(xp: number): { level: number; title: string; nextLevelXP: number; progress: number } {
  const levels = [
    { min: 0, title: 'Beginner' },
    { min: 100, title: 'Learner' },
    { min: 300, title: 'Student' },
    { min: 600, title: 'Scholar' },
    { min: 1000, title: 'Expert' },
    { min: 1500, title: 'Master' },
    { min: 2500, title: 'Grandmaster' },
  ];

  let currentLevel = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].min) {
      currentLevel = i;
      break;
    }
  }

  const nextLevel = currentLevel < levels.length - 1 ? currentLevel + 1 : currentLevel;
  const currentMin = levels[currentLevel].min;
  const nextMin = levels[nextLevel].min;
  const progress = nextMin > currentMin
    ? Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100)
    : 100;

  return {
    level: currentLevel + 1,
    title: levels[currentLevel].title,
    nextLevelXP: nextMin,
    progress,
  };
}
