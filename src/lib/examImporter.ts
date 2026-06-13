import type { Question } from './dataLoader';

interface RawBlock {
  type: string;
  text: string;
}

interface RawQuestion {
  questionKey: string;
  sourceId: number;
  question: RawBlock[];
  options: { key: string; blocks: RawBlock[] }[];
  correctAnswers: number[];
  explanation: string;
  selectionMode: string;
  isValid: boolean;
}

interface RawExamFile {
  url: string;
  title: string;
  questions: RawQuestion[];
  count: number;
}

export interface ExamFileInfo {
  department: string;
  year: string;
  filePath: string;
  questionCount: number;
  fileName: string;
}

export interface ScanResult {
  departments: string[];
  totalFiles: number;
  totalQuestions: number;
  files: ExamFileInfo[];
}

function formatDeptName(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function parseExamQuestion(
  raw: RawQuestion,
  department: string,
  year: string,
  typeLabel: string,
): Question {
  const questionText = raw.question
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const options = raw.options.map(o =>
    o.blocks
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n'),
  );

  const correctIdx = (raw.correctAnswers[0] ?? 1) - 1;
  const answer = options[correctIdx] || '';

  return {
    id: `exam_${department}_${year}_${raw.questionKey}`,
    question: questionText,
    options,
    answer,
    explanation: raw.explanation || '',
    topic: formatDeptName(department),
    difficulty: 'medium',
    source: `${formatDeptName(department)} ${year}${typeLabel}`,
  };
}

export function loadExamQuestions(fileInfo: ExamFileInfo): Question[] {
  const fs = require('fs') as typeof import('fs');
  const content: RawExamFile = JSON.parse(
    fs.readFileSync(fileInfo.filePath, 'utf-8'),
  );
  const dept = fileInfo.department;
  const typeLabel =
    fileInfo.fileName === 'model.json' ? ' Model' : '';
  return (content.questions || [])
    .filter(q => q.isValid !== false)
    .map(q => parseExamQuestion(q, dept, fileInfo.year, typeLabel));
}
