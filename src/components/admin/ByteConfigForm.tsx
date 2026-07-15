'use client';

import VideoUrlManager from '@/components/admin/VideoUrlManager';

type Major = 'CSE' | 'Software' | 'Both';
type SourceType = 'github' | 'video' | 'manual';

interface ByteConfigFormProps {
  selectedCourse: string;
  title: string;
  subTopic: string;
  major: Major;
  sourceType: SourceType;
  githubUrl: string;
  manualContent: string;
  videoUrls: string[];
  newVideoUrl: string;
  existingSubTopics: string[];
  isFetching: boolean;
  onTitleChange: (value: string) => void;
  onSubTopicChange: (value: string) => void;
  onMajorChange: (value: Major) => void;
  onSourceTypeChange: (value: SourceType) => void;
  onGithubUrlChange: (value: string) => void;
  onManualContentChange: (value: string) => void;
  onNewVideoUrlChange: (value: string) => void;
  onAddVideoUrl: () => void;
  onRemoveVideoUrl: (index: number) => void;
  onBack: () => void;
  onVerifyAndPreview: () => void;
}

export default function ByteConfigForm({
  selectedCourse,
  title,
  subTopic,
  major,
  sourceType,
  githubUrl,
  manualContent,
  videoUrls,
  newVideoUrl,
  existingSubTopics,
  isFetching,
  onTitleChange,
  onSubTopicChange,
  onMajorChange,
  onSourceTypeChange,
  onGithubUrlChange,
  onManualContentChange,
  onNewVideoUrlChange,
  onAddVideoUrl,
  onRemoveVideoUrl,
  onBack,
  onVerifyAndPreview,
}: ByteConfigFormProps) {
  return (
    <div className="glass-card p-6 sm:p-10 border-white/5 bg-black/40 animate-in fade-in zoom-in-95 duration-300 space-y-6">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 bg-black/40 p-4 rounded-xl border border-white/5">
        <span className="text-gray-500">Destination Folder:</span>
        <span className="text-accent-purple">{selectedCourse}</span>
        <button
          type="button"
          onClick={onBack}
          className="ml-auto text-[10px] text-gray-500 hover:text-white border border-white/10 hover:border-white/30 rounded px-2 py-0.5"
        >
          Change
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Specific Title <span className="text-accent-purple">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="E.g. Introduction to B-Trees"
              className="modern-input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Sub-topic</label>
            <input
              type="text"
              value={subTopic}
              onChange={(e) => onSubTopicChange(e.target.value)}
              placeholder="E.g. Tree Structures"
              className="modern-input w-full"
            />

            {existingSubTopics.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-600 block">Existing Sub-topics in folder:</span>
                <div className="flex flex-wrap gap-1.5">
                  {existingSubTopics.map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onSubTopicChange(st)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-white/5 bg-white/5 text-gray-400 hover:border-accent-purple/30 hover:text-white transition-all"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Major Focus</label>
            <select
              value={major}
              onChange={(e) => onMajorChange(e.target.value as Major)}
              className="modern-input w-full cursor-pointer"
            >
              <option value="Both">Both CSE & Software</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="Software">Software Engineering</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Lesson Content Type</label>
            <div className="grid grid-cols-3 gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
              {(['github', 'video', 'manual'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSourceTypeChange(type)}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    sourceType === type ? 'bg-accent-purple text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type === 'github' ? 'GitHub Raw' : type === 'video' ? 'Video URL' : 'Write MD'}
                </button>
              ))}
            </div>
          </div>

          {sourceType === 'github' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">GitHub Raw URL (.md) <span className="text-accent-purple">*</span></label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => onGithubUrlChange(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../lesson.md"
                  className="modern-input w-full"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-semibold">
                Make sure the URL is direct raw file content (e.g. starts with raw.githubusercontent.com).
              </p>
            </div>
          )}

          {sourceType === 'video' && (
            <div className="space-y-2 animate-in fade-in duration-200 bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-400 leading-relaxed uppercase font-bold">
                Video Lesson Mode selected. Please add one or more video links using the manager below.
              </p>
            </div>
          )}

          {sourceType === 'manual' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Markdown Body <span className="text-accent-purple">*</span></label>
                <textarea
                  value={manualContent}
                  onChange={(e) => onManualContentChange(e.target.value)}
                  placeholder="# Write lesson content using Markdown..."
                  rows={8}
                  className="modern-input w-full font-mono text-xs leading-relaxed resize-y"
                  required
                />
              </div>
            </div>
          )}

          <VideoUrlManager
            sourceType={sourceType}
            videoUrls={videoUrls}
            newVideoUrl={newVideoUrl}
            onNewVideoUrlChange={onNewVideoUrlChange}
            onAdd={onAddVideoUrl}
            onRemove={onRemoveVideoUrl}
          />
        </div>
      </div>

      <div className="border-t border-white/5 pt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onVerifyAndPreview}
          disabled={isFetching}
          className="btn-primary px-8 py-3 text-xs font-black uppercase italic tracking-widest shadow-xl shadow-purple-500/10"
        >
          {isFetching ? 'Fetching Link...' : 'Verify & Preview'}
        </button>
      </div>
    </div>
  );
}
