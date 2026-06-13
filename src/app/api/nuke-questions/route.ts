import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

const KEEP_DEPTS = ['accounting and finance', 'computer science'];

export async function POST() {
  try {
    const { data: allSources } = await supabaseAdmin
      .from('questions')
      .select('source');

    if (!allSources || allSources.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No questions found' });
    }

    const uniqueSources = [...new Set(allSources.map((r: any) => r.source))];

    let totalDeleted = 0;
    const kept: string[] = [];

    for (const source of uniqueSources) {
      const sourceLower = source.toLowerCase();
      const shouldKeep = KEEP_DEPTS.some(d => sourceLower.startsWith(d));

      if (shouldKeep) {
        kept.push(source);
        continue;
      }

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
      kept,
      message: `Deleted ${totalDeleted} source sets. Kept all sources under Accounting & Finance and Computer Science.`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
