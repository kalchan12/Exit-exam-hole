export const SECONDS_PER_QUESTION = 60;
export const TIMER_WARNING_SECONDS = 60;
export const TIMER_URGENT_SECONDS = 300;
export const POINTS_PER_QUESTION = 2;

export const topicMeta: Record<string, { icon: string; gradient: string; border: string }> = {
  'Algorithms': { icon: '\u26a1', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30' },
  'Operating Systems': { icon: '\ud83d\udda5\ufe0f', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
  'Database Systems': { icon: '\ud83d\udcc4', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30' },
  'Networking': { icon: '\ud83c\udf10', gradient: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30' },
  'Software Engineering': { icon: '\ud83d\udee0\ufe0f', gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30' },
  'Data Structures': { icon: '\ud83e\uddf1', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30' },
  'Computer Architecture': { icon: '\ud83d\udd27', gradient: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30' },
};

export const defaultMeta = { icon: '\ud83d\udcdd', gradient: 'from-primary/20 to-surface-container-highest', border: 'border-primary/30' };

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
};

export const BACK_LINK_CLASSES = 'inline-flex items-center gap-2 text-label-xs text-on-surface-variant hover:text-primary transition-colors font-medium';
