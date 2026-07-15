'use client';

interface VideoUrlManagerProps {
  sourceType: string;
  videoUrls: string[];
  newVideoUrl: string;
  onNewVideoUrlChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function VideoUrlManager({
  sourceType,
  videoUrls,
  newVideoUrl,
  onNewVideoUrlChange,
  onAdd,
  onRemove,
}: VideoUrlManagerProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-white/5 animate-in fade-in">
      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
        {sourceType === 'video' ? 'Video Links (At least one required) *' : 'Video Links (Optional)'}
      </label>

      {videoUrls.length > 0 && (
        <div className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
          {videoUrls.map((url, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-black/40 px-3 py-2 rounded-lg border border-white/5">
              <span className="text-gray-300 font-mono truncate flex-1">{url}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-red-400 hover:text-red-300 font-bold px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-all text-[10px] uppercase tracking-wider"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newVideoUrl}
          onChange={(e) => onNewVideoUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="modern-input flex-1 text-xs"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 bg-accent-purple/20 text-accent-purple hover:bg-accent-purple hover:text-white rounded-xl border border-accent-purple/30 text-xs font-black uppercase tracking-wider transition-all"
        >
          Add Video
        </button>
      </div>
      <p className="text-[9px] text-gray-500 uppercase font-semibold">
        Supports YouTube links. Press &quot;Add Video&quot; or Enter to add.
      </p>
    </div>
  );
}
