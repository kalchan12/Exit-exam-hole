import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { loadExamQuestions, type ExamFileInfo } from '@/lib/examImporter';
import { supabaseAdmin } from '@/lib/supabaseServer';

const EXAMS_ROOT =
  process.env.EXAMS_PATH || path.join(process.env.HOME || '/home/kal', 'exams');

function scanDirectory(): ExamFileInfo[] {
  const results: ExamFileInfo[] = [];

  if (!fs.existsSync(EXAMS_ROOT)) return results;

  const departments = fs
    .readdirSync(EXAMS_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dept of departments) {
    const deptPath = path.join(EXAMS_ROOT, dept);
    const years = fs
      .readdirSync(deptPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const year of years) {
      const yearPath = path.join(deptPath, year);
      const files = fs.readdirSync(yearPath).filter(f => f.endsWith('.json'));

      for (const file of files) {
        const filePath = path.join(yearPath, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const count = content.questions?.length || content.count || 0;
          results.push({
            department: dept,
            year,
            filePath,
            questionCount: count,
            fileName: file,
          });
        } catch {
          results.push({
            department: dept,
            year,
            filePath,
            questionCount: 0,
            fileName: file,
          });
        }
      }
    }
  }

  return results.sort((a, b) =>
    a.department.localeCompare(b.department) ||
    a.year.localeCompare(b.year) ||
    a.fileName.localeCompare(b.fileName),
  );
}

export async function GET() {
  try {
    const files = scanDirectory();
    const depts = Array.from(new Set(files.map(f => f.department))).sort();

    const { data: existingSources } = await supabaseAdmin
      .from('questions')
      .select('source');

    const existingSourceSet = new Set(
      (existingSources || []).map((r: any) => r.source),
    );

    return NextResponse.json({
      departments: depts,
      totalDepartments: depts.length,
      totalFiles: files.length,
      totalQuestions: files.reduce((s, f) => s + f.questionCount, 0),
      files: files.map(f => ({
        department: f.department,
        year: f.year,
        fileName: f.fileName,
        questionCount: f.questionCount,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const selectedFiles: { department: string; year: string; fileName: string }[] =
      body.files || [];

    const allFiles = scanDirectory();
    const filesToImport = allFiles.filter(f =>
      selectedFiles.some(
        s =>
          s.department === f.department &&
          s.year === f.year &&
          s.fileName === f.fileName,
      ),
    );

    const { data: existingRows } = await supabaseAdmin
      .from('questions')
      .select('id');
    const existingIdSet = new Set((existingRows || []).map((r: any) => r.id));

    const result: {
      file: string;
      department: string;
      imported: number;
      skipped: number;
      total: number;
      error?: string;
    }[] = [];

    for (const fileInfo of filesToImport) {
      try {
        const questions = loadExamQuestions(fileInfo);

        const newQuestions = questions.filter(q => !existingIdSet.has(q.id));
        const skipped = questions.length - newQuestions.length;

        if (newQuestions.length === 0) {
          result.push({
            file: `${fileInfo.department}/${fileInfo.year}/${fileInfo.fileName}`,
            department: fileInfo.department,
            imported: 0,
            skipped,
            total: questions.length,
          });
          continue;
        }

        const batchSize = 100;
        let imported = 0;
        for (let i = 0; i < newQuestions.length; i += batchSize) {
          const batch = newQuestions.slice(i, i + batchSize).map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation || '',
            topic: q.topic,
            difficulty: q.difficulty || 'medium',
            source: q.source,
          }));

          const { error } = await supabaseAdmin
            .from('questions')
            .upsert(batch, { onConflict: 'id' });

          if (error) {
            console.error(`Batch insert error for ${fileInfo.filePath}:`, error);
          } else {
            imported += batch.length;
          }
        }

        result.push({
          file: `${fileInfo.department}/${fileInfo.year}/${fileInfo.fileName}`,
          department: fileInfo.department,
          imported,
          skipped,
          total: questions.length,
        });
      } catch (e) {
        result.push({
          file: `${fileInfo.department}/${fileInfo.year}/${fileInfo.fileName}`,
          department: fileInfo.department,
          imported: 0,
          skipped: 0,
          total: 0,
          error: String(e),
        });
      }
    }

    return NextResponse.json({ files: result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
