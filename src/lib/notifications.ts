const NOTIFICATION_KEY = 'cs_exam_prep_notifications';

interface NotificationState {
  lastCheckedNotes: string;
  lastCheckedBytes: string;
  lastCheckedExam: string;
}

const defaultNotifications: NotificationState = {
  lastCheckedNotes: '',
  lastCheckedBytes: '',
  lastCheckedExam: '',
};

function getState(): NotificationState {
  if (typeof window === 'undefined') return { ...defaultNotifications };
  try {
    const raw = localStorage.getItem(NOTIFICATION_KEY);
    return raw ? { ...defaultNotifications, ...JSON.parse(raw) } : { ...defaultNotifications };
  } catch {
    return { ...defaultNotifications };
  }
}

function saveState(state: NotificationState): void {
  try {
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function markSectionChecked(section: 'notes' | 'bytes' | 'exam'): void {
  const state = getState();
  const key = section === 'notes' ? 'lastCheckedNotes' : section === 'bytes' ? 'lastCheckedBytes' : 'lastCheckedExam';
  state[key] = new Date().toISOString();
  saveState(state);
}

export function getUnreadCount(
  section: 'notes' | 'bytes' | 'exam',
  items: { date?: string }[]
): number {
  const state = getState();
  const key = section === 'notes' ? 'lastCheckedNotes' : section === 'bytes' ? 'lastCheckedBytes' : 'lastCheckedExam';
  const lastChecked = state[key];
  if (!lastChecked) return Math.min(items.length, 9);
  return items.filter(item => item.date && item.date > lastChecked).length;
}
