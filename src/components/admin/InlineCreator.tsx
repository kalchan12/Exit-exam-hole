'use client';

interface InlineCreatorProps {
  isAdding: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onStart: () => void;
  placeholder?: string;
  buttonLabel?: string;
  noun?: string;
}

export default function InlineCreator({
  isAdding,
  value,
  onValueChange,
  onAdd,
  onCancel,
  onStart,
  placeholder = 'New name...',
  buttonLabel = 'Add',
  noun = 'New',
}: InlineCreatorProps) {
  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-black/20 flex flex-col justify-center min-h-[82px]">
      {isAdding ? (
        <form onSubmit={(e) => { e.preventDefault(); onAdd(); }} className="space-y-2 w-full">
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent-purple focus:outline-none"
            required
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-accent-purple hover:bg-accent-purple-glow text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-colors"
            >
              {buttonLabel}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={onStart}
          className="w-full h-full flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors"
        >
          <span className="text-xl">+</span>
          <span className="text-xs font-black uppercase tracking-widest">{noun}</span>
        </button>
      )}
    </div>
  );
}
