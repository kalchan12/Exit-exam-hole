'use client';

interface SelectionCardProps {
  title: string;
  desc: string;
  icon: string;
  onClick: () => void;
  variant?: 'purple' | 'indigo';
}

export default function SelectionCard({ title, desc, icon, onClick, variant = 'purple' }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group p-6 text-left rounded-3xl border-2 transition-all duration-300 relative overflow-hidden bg-[#11152a] min-h-[140px] flex flex-col justify-center ${
        variant === 'purple'
          ? 'border-white/5 hover:border-accent-purple/40 hover:shadow-2xl hover:shadow-purple-500/10'
          : 'border-white/5 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10'
      }`}
    >
      <div className="text-3xl mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-all origin-left">{icon}</div>
      <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-1 leading-tight">{title}</h3>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed pr-4">{desc}</p>
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity ${variant === 'purple' ? 'bg-accent-purple' : 'bg-indigo-500'}`} />
    </button>
  );
}
