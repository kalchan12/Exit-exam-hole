'use client';

interface FolderCardProps {
  name: string;
  count: number;
  onClick: () => void;
}

export default function FolderCard({ name, count, onClick }: FolderCardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-5 rounded-2xl border border-white/5 bg-black/20 hover:border-accent-purple/40 hover:bg-[#11152a] hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
    >
      <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center group-hover:scale-115 transition-transform flex-shrink-0">
        <svg className="w-6 h-6 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0120.25 21H3.75A2.25 2.25 0 011.5 18.75v-4.5A2.25 2.25 0 013.75 13.5zm0-3h16.5a1.5 1.5 0 001.5-1.5V6.75A1.5 1.5 0 0020.25 5.25H9.75a1.5 1.5 0 01-1.12-.5l-1.01-1.26a1.5 1.5 0 00-1.12-.5H3.75A1.5 1.5 0 002.25 4.5v4.25a1.5 1.5 0 001.5 1.5z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-white font-bold text-xs truncate leading-tight group-hover:text-accent-purple-light transition-colors">
          {name}
        </h3>
        <p className="text-gray-500 text-[9px] font-black uppercase tracking-wider mt-1">
          {count} {count === 1 ? 'Byte' : 'Bytes'}
        </p>
      </div>
      <div className="absolute top-0 right-0 w-20 h-20 blur-[30px] opacity-0 group-hover:opacity-10 bg-accent-purple transition-opacity pointer-events-none" />
    </button>
  );
}
