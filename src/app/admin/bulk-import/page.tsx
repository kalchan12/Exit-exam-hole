'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { invalidateQuestionsCache } from '@/lib/dataLoader';

interface FileInfo {
  department: string;
  year: string;
  fileName: string;
  questionCount: number;
}

interface ScanData {
  departments: string[];
  totalDepartments: number;
  totalFiles: number;
  totalQuestions: number;
  files: FileInfo[];
}

interface ImportResult {
  file: string;
  department: string;
  imported: number;
  skipped: number;
  total: number;
  error?: string;
}

interface ProgressEntry {
  file: string;
  department: string;
  imported: number;
  skipped: number;
  total: number;
  status: 'pending' | 'importing' | 'done' | 'error';
  error?: string;
}

export default function BulkImportPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    if (!authLoading && profile?.username !== 'psycho') {
      router.replace('/dashboard');
    }
  }, [profile, authLoading, router]);

  const handleScan = async () => {
    setIsScanning(true);
    setError('');
    setProgress([]);
    try {
      const res = await fetch('/api/import-exams');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Scan failed');
      }
      const data = await res.json();
      setScanData(data);
      setSelectedDepts(new Set(data.departments));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleDept = (dept: string) => {
    const next = new Set(selectedDepts);
    if (next.has(dept)) next.delete(dept);
    else next.add(dept);
    setSelectedDepts(next);
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    if (selectAll || !scanData) {
      setSelectedDepts(new Set());
      setSelectAll(false);
    } else {
      setSelectedDepts(new Set(scanData.departments));
      setSelectAll(true);
    }
  };

  const handleImport = async () => {
    if (!scanData) return;
    setIsImporting(true);
    setError('');

    const filesToImport = scanData.files.filter(f =>
      selectedDepts.has(f.department),
    );

    setProgress(
      filesToImport.map(f => ({
        file: `${f.department}/${f.year}/${f.fileName}`,
        department: f.department,
        imported: 0,
        skipped: 0,
        total: f.questionCount,
        status: 'pending' as const,
      })),
    );

    try {
      const res = await fetch('/api/import-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToImport }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Import failed');
      }
      const data: { files: ImportResult[] } = await res.json();

      setProgress(prev =>
        prev.map(p => {
          const match = data.files.find(f => f.file === p.file);
          if (!match) return { ...p, status: 'error' as const, error: 'No result returned' };
          return {
            ...p,
            imported: match.imported,
            skipped: match.skipped,
            total: match.total,
            status: match.error ? 'error' as const : 'done' as const,
            error: match.error,
          };
        }),
      );

      invalidateQuestionsCache();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (authLoading) {
    return <div className="text-gray-500 text-center py-20">Loading...</div>;
  }

  const totalImported = progress.filter(p => p.status === 'done').reduce((s, p) => s + p.imported, 0);
  const totalSkipped = progress.filter(p => p.status === 'done').reduce((s, p) => s + p.skipped, 0);
  const totalErrors = progress.filter(p => p.status === 'error').length +
    progress.filter(p => p.status === 'done').reduce((s, p) => s + (p.total - p.imported - p.skipped), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">
            Bulk Import
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 uppercase font-bold tracking-widest">
            Import exam questions from server filesystem
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScan}
            disabled={isScanning || isImporting}
            className="px-5 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple-light text-white font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50"
          >
            {isScanning ? 'Scanning...' : 'Scan Directory'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      {!scanData && !isScanning && (
        <div className="glass-card p-16 text-center border-white/5">
          <div className="text-5xl mb-6">📂</div>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-3">
            No Scan Data
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Click <strong>Scan Directory</strong> to discover exam files in the
            server&apos;s <code className="text-accent-purple">~/exams</code>{' '}
            directory. You&apos;ll see a preview before importing.
          </p>
        </div>
      )}

      {isScanning && (
        <div className="glass-card p-16 text-center border-white/5">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Scanning exam files...</p>
        </div>
      )}

      {scanData && !isScanning && !isImporting && progress.length === 0 && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-5 text-center border-white/5">
              <div className="text-3xl font-black text-white italic">
                {scanData.totalDepartments}
              </div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                Departments
              </div>
            </div>
            <div className="glass-card p-5 text-center border-white/5">
              <div className="text-3xl font-black text-white italic">
                {scanData.totalFiles}
              </div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                Exam Files
              </div>
            </div>
            <div className="glass-card p-5 text-center border-white/5">
              <div className="text-3xl font-black text-accent-purple italic">
                {scanData.totalQuestions}
              </div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                Total Questions
              </div>
            </div>
            <div className="glass-card p-5 text-center border-white/5">
              <div className="text-3xl font-black text-emerald-400 italic">
                {scanData.files.filter(f => selectedDepts.has(f.department)).reduce((s, f) => s + f.questionCount, 0)}
              </div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                Selected Questions
              </div>
            </div>
          </div>

          <div className="glass-card border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white italic uppercase tracking-widest">
                Departments
              </h3>
              <button
                onClick={toggleSelectAll}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                  selectAll
                    ? 'bg-accent-purple/20 text-accent-purple'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-5 max-h-96 overflow-y-auto">
              {scanData.departments.map(dept => {
                const deptFiles = scanData.files.filter(f => f.department === dept);
                const total = deptFiles.reduce((s, f) => s + f.questionCount, 0);
                const isSelected = selectedDepts.has(dept);
                return (
                  <button
                    key={dept}
                    onClick={() => toggleDept(dept)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-accent-purple/10 border-accent-purple/30 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider leading-tight mb-1">
                      {dept.replace(/-/g, ' ')}
                    </div>
                    <div className="text-[10px] opacity-60">
                      {deptFiles.length} file{deptFiles.length !== 1 ? 's' : ''},{' '}
                      {total} Qs
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDepts.size > 0 && (
            <div className="glass-card border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-sm font-black text-white italic uppercase tracking-widest">
                  Selected Files Preview
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-black uppercase tracking-widest">
                      <th className="text-left p-3 pl-5">Department</th>
                      <th className="text-left p-3">Year</th>
                      <th className="text-left p-3">File</th>
                      <th className="text-right p-3 pr-5">Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanData.files
                      .filter(f => selectedDepts.has(f.department))
                      .map((file, i) => (
                        <tr
                          key={`${file.department}-${file.year}-${file.fileName}`}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                            i % 2 === 0 ? 'bg-white/[0.02]' : ''
                          }`}
                        >
                          <td className="p-3 pl-5 font-bold text-white">
                            {file.department.replace(/-/g, ' ')}
                          </td>
                          <td className="p-3">{file.year}</td>
                          <td className="p-3 text-gray-400">{file.fileName}</td>
                          <td className="p-3 pr-5 text-right font-bold text-accent-purple">
                            {file.questionCount}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleImport}
              disabled={isImporting || selectedDepts.size === 0}
              className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] disabled:shadow-none"
            >
              {isImporting
                ? 'Importing...'
                : `Import ${selectedDepts.size} Department${selectedDepts.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}

      {/* Progress during import */}
      {progress.length > 0 && (
        <div className="glass-card border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-black text-white italic uppercase tracking-widest">
              Import Progress
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              {totalImported} imported, {totalSkipped} skipped, {totalErrors} errors across {progress.length} files
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {progress.map(entry => (
              <div
                key={entry.file}
                className="flex items-center gap-4 p-4 border-b border-white/5 text-sm"
              >
                <div className="text-lg">
                  {entry.status === 'done' && entry.imported === entry.total && '✅'}
                  {entry.status === 'done' && entry.imported < entry.total && entry.skipped > 0 && '♻️'}
                  {entry.status === 'done' && entry.imported < entry.total && entry.skipped === 0 && '⚠️'}
                  {entry.status === 'importing' && '⏳'}
                  {entry.status === 'error' && '❌'}
                  {entry.status === 'pending' && '⏸️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{entry.file}</div>
                  <div className="text-gray-500 text-xs">
                    {entry.status === 'done'
                      ? `${entry.imported} imported, ${entry.skipped} skipped`
                      : entry.status === 'importing'
                        ? 'Saving...'
                        : entry.status === 'error'
                          ? `Error: ${entry.error || 'Unknown'}`
                          : `${entry.total} questions ready`}
                  </div>
                </div>
                {entry.status === 'done' && (
                  <div className="text-emerald-400 font-bold text-xs whitespace-nowrap">
                    {entry.imported}/{entry.total}
                    {entry.skipped > 0 && ` (${entry.skipped} exist)`}
                  </div>
                )}
              </div>
            ))}
          </div>
          {!isImporting && progress.some(p => p.status === 'done') && (
            <div className="p-5 border-t border-white/5">
              <button
                onClick={() => setProgress([])}
                className="px-5 py-2 rounded-xl bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 font-black uppercase tracking-widest text-xs transition-all"
              >
                Start New Import
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
