export const XP_CORRECT_ANSWER = 10;
export const XP_NOTE_COMPLETED = 5;
export const XP_BYTE_COMPLETED = 5;
export const DAILY_CHALLENGE_COUNT = 5;
export const SYNC_DEBOUNCE_MS = 2000;

export const LEVELS = [
  { min: 0, title: 'Beginner' },
  { min: 100, title: 'Learner' },
  { min: 300, title: 'Student' },
  { min: 600, title: 'User' },
  { min: 1000, title: 'Expert' },
  { min: 1500, title: 'Master' },
  { min: 2500, title: 'Grandmaster' },
] as const;

export const MAX_STREAK_DOTS = 5;
export const ACCURACY_WEIGHT = 0.3;
export const WEAK_TOPIC_THRESHOLD = 50;

export const PINNED_DEPARTMENTS = ['Computer Science', 'Software Engineering'];
