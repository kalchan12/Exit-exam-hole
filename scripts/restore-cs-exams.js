/**
 * Restores Computer Science exam data in ~/exams/computer-science/
 * by converting simplified question format to RawExamFile format.
 *
 * Run: node scripts/restore-cs-exams.js
 */

const fs = require('fs');
const path = require('path');

const EXAMS_DIR = path.join(process.env.HOME || '/home/kal', 'exams');
const CS_DIR = path.join(EXAMS_DIR, 'computer-science');
const SOURCE_DIR = path.join(__dirname, '..', 'Exit exam Questions');

const YEAR_MAP = {
  'Exit Exam 2015': { year: '2015', fileName: 'regular.json', title: 'Computer Science 2015 Exit Exam' },
  'Exit Exam 2016(jan)': { year: '2016', fileName: 'regular.json', title: 'Computer Science 2016 Exit Exam' },
  'Exit Exam 2017': { year: '2017', fileName: 'regular.json', title: 'Computer Science 2017 Exit Exam' },
  'Exit Exan 2017(jan)': { year: '2017-jan', fileName: 'regular.json', title: 'Computer Science 2017 (Jan) Exit Exam' },
  'Exit Exam 2018 (mid semester)': { year: '2018-mid', fileName: 'regular.json', title: 'Computer Science 2018 Mid Semester Exit Exam' },
};

function getSourceId(yearKey) {
  const map = {
    '2015': 1,
    '2016': 2,
    '2017': 3,
    '2017-jan': 4,
    '2018-mid': 5,
  };
  return map[yearKey] || 99;
}

function convertQuestions(questions, yearKey) {
  return questions.map((q, i) => ({
    questionKey: `q_${i}`,
    sourceId: getSourceId(yearKey),
    question: [
      { type: 'text', text: q.question }
    ],
    options: q.options.map((opt, oi) => ({
      key: `option_${oi}`,
      blocks: [{ type: 'text', text: opt }]
    })),
    correctAnswers: [q.options.indexOf(q.answer) + 1],
    explanation: q.explanation || '',
    selectionMode: 'single',
    isValid: true,
  }));
}

function processFolder(folderName, config) {
  const folderPath = path.join(SOURCE_DIR, folderName);
  if (!fs.existsSync(folderPath)) {
    console.log(`  SKIP: ${folderName} not found`);
    return;
  }

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log(`  SKIP: No JSON files in ${folderName}`);
    return;
  }

  const jsonFile = path.join(folderPath, files[0]);
  const rawData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

  const questions = Array.isArray(rawData) ? rawData : (rawData.questions || []);
  if (questions.length === 0) {
    console.log(`  SKIP: No questions in ${files[0]}`);
    return;
  }

  const yearDir = path.join(CS_DIR, config.year);
  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true });
  }

  const examContent = {
    url: `https://exitexamstudio.app/exam/computer-science__${config.year}__regular`,
    title: config.title,
    questions: convertQuestions(questions, config.year),
    count: questions.length,
  };

  const outPath = path.join(yearDir, config.fileName);
  fs.writeFileSync(outPath, JSON.stringify(examContent, null, 2));
  console.log(`  OK: ${questions.length} questions → ${outPath}`);
}

function main() {
  console.log('Restoring Computer Science exam data...\n');

  if (!fs.existsSync(EXAMS_DIR)) {
    fs.mkdirSync(EXAMS_DIR, { recursive: true });
    console.log(`Created ${EXAMS_DIR}`);
  }

  if (!fs.existsSync(CS_DIR)) {
    fs.mkdirSync(CS_DIR, { recursive: true });
    console.log(`Created ${CS_DIR}`);
  }

  let total = 0;
  for (const [folderName, config] of Object.entries(YEAR_MAP)) {
    processFolder(folderName, config);
    const dest = path.join(CS_DIR, config.year, config.fileName);
    if (fs.existsSync(dest)) {
      const content = JSON.parse(fs.readFileSync(dest, 'utf-8'));
      total += content.questions?.length || 0;
    }
  }

  console.log(`\nDone. Total questions restored: ${total}`);
  console.log(`Location: ${CS_DIR}/`);
}

main();
