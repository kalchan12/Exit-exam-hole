import { Question } from './dataLoader';

/**
 * Parses questions from a Markdown string.
 */
export function parseQuestionsFromMarkdown(text: string, defaultTopic: string = 'General'): Question[] {
  const questions: Question[] = [];
  const entries = text.split(/---+\n?/).filter(Boolean);

  entries.forEach(entry => {
    const lines = entry.trim().split('\n');
    let q: any = { 
        options: [], 
        id: `q_parsed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        date: new Date().toISOString()
    };
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### Topic:')) q.topic = trimmed.replace('### Topic:', '').trim();
      else if (trimmed.startsWith('**Difficulty:')) {
          q.difficulty = trimmed.replace('**Difficulty:', '').replace(/\*/g, '').replace('Difficulty:', '').trim().toLowerCase() || 'medium';
      }
      else if (trimmed.startsWith('**Question:**')) q.question = trimmed.replace('**Question:**', '').trim();
      else if (trimmed.match(/^[A-D]\)/)) q.options.push(trimmed.replace(/^[A-D]\)/, '').trim());
      else if (trimmed.startsWith('**Answer:**')) {
        const letter = trimmed.replace('**Answer:**', '').trim().toUpperCase();
        q.answer_letter = letter;
      }
      else if (trimmed.startsWith('**Explanation:**')) q.explanation = trimmed.replace('**Explanation:**', '').trim();
    });

    if (q.answer_letter) {
      const idx = q.answer_letter.charCodeAt(0) - 65;
      q.answer = q.options[idx];
      delete q.answer_letter;
    }

    q.topic = q.topic || defaultTopic;
    q.difficulty = q.difficulty || 'medium';
    q.explanation = q.explanation || 'Imported content.';

    if (q.question && q.options.length >= 2 && q.answer) {
        questions.push(q as Question);
    }
  });
  return questions;
}

/**
 * Parses questions from a JSON string.
 */
export function parseQuestionsFromJson(text: string, defaultSource: string = 'past_exam'): Question[] {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return (parsed as any[]).map(q => ({
      ...q,
      id: q.id || `q_json_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      date: q.date || new Date().toISOString(),
      difficulty: q.difficulty || 'medium',
      source: q.source || defaultSource,
      explanation: q.explanation || 'Imported JSON content.'
    })).filter(q => q.question && q.options?.length >= 2 && q.answer);
  } catch (e) {
    console.error('Failed to parse questions from JSON:', e);
    return [];
  }
}
