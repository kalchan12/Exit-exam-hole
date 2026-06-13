import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { DEPARTMENT_SOURCES } from '@/lib/dataLoader';

const KEEP_DEPARTMENTS = ['Accounting And Finance', 'Computer Science'];

export async function POST() {
  try {
    const { data: allSources } = await supabaseAdmin
      .from('questions')
      .select('source');

    if (!allSources || allSources.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No questions found' });
    }

    const uniqueSources = [...new Set(allSources.map((r: any) => r.source))];

    const keepSources = new Set<string>();
    for (const dept of KEEP_DEPARTMENTS) {
      const sources = DEPARTMENT_SOURCES[dept];
      if (sources) {
        for (const s of sources) {
          keepSources.add(s);
        }
      }
    }

    let totalDeleted = 0;
    for (const source of uniqueSources) {
      if (keepSources.has(source)) continue;

      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .eq('source', source);

      if (error) {
        console.error(`Error deleting source "${source}":`, error.message);
      } else {
        totalDeleted++;
        console.log(`Deleted source: "${source}"`);
      }
    }

    return NextResponse.json({
      deleted: totalDeleted,
      keptSources: [...keepSources],
      message: `Deleted ${totalDeleted} source sets. Only ${KEEP_DEPARTMENTS.join(' & ')} questions remain.`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
