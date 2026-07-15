'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BytePreviewData {
  topic?: string;
  sub_topic?: string;
  major?: string;
  title?: string;
  content?: string;
  videoUrls?: string[];
  videoUrl?: string;
  images?: string[];
}

interface BytePreviewProps {
  previewData: BytePreviewData;
  isFetching: boolean;
  onEdit: () => void;
  onPublish: () => void;
}

export default function BytePreview({ previewData, isFetching, onEdit, onPublish }: BytePreviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="glass-card p-6 border-white/5 bg-black/40 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Inspect Lesson Rendition</h3>
          <p className="text-gray-500 text-xs uppercase font-semibold">Review this exact render to see how it will display to exit exam candidates.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white border border-white/10 rounded-xl transition-all"
          >
            Edit Fields
          </button>
        </div>
      </div>

      <div className="bg-[#0a0b1e] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative bg-gradient-to-r from-[#11132f] to-[#0a0c20] p-8 border-b border-white/5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border text-accent-purple-glow border-accent-purple/30 bg-accent-purple/10">
              {previewData.topic}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border text-amber-400/80 border-amber-500/20 bg-amber-500/10">
              {previewData.sub_topic}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border text-indigo-400/80 border-indigo-500/20 bg-indigo-500/10">
              {previewData.major || 'Both Majors'}
            </span>
            <span className="text-gray-500 text-xs ml-auto">Previewing Render</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase italic tracking-tighter">
            {previewData.title}
          </h1>
        </div>

        <div className="p-8 space-y-6">
          {previewData.videoUrls && previewData.videoUrls.length > 0 ? (
            previewData.videoUrls.map((url, index) => (
              <div key={index} className="aspect-video rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black/60 max-w-2xl mx-auto mb-4">
                <iframe
                  src={url}
                  className="w-full h-full"
                  allowFullScreen
                  title={`Video Preview ${index + 1}`}
                />
              </div>
            ))
          ) : (
            previewData.videoUrl && (
              <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black/60 max-w-2xl mx-auto">
                <iframe
                  src={previewData.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title="Video Preview"
                />
              </div>
            )
          )}

          <div className="prose prose-invert prose-purple max-w-none text-gray-300 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {previewData.content || ''}
            </ReactMarkdown>
          </div>

          {previewData.images && previewData.images.length > 0 && (
            <div className="mt-8 space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Extracted Media Assets:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewData.images.map((img, i) => (
                  <img key={i} src={img} alt={`Asset ${i + 1}`} className="rounded-xl border border-white/5 w-full object-cover shadow-lg bg-black/40" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
        >
          Edit Details
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isFetching}
          className="btn-primary px-8 py-3 text-xs font-black uppercase italic tracking-widest shadow-xl shadow-purple-500/25"
        >
          {isFetching ? 'Synchronizing DB...' : 'Publish Byte to Matrix'}
        </button>
      </div>
    </div>
  );
}
