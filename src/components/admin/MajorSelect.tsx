'use client';

type Major = 'CSE' | 'Software' | 'Both';

interface MajorSelectProps {
  value: Major;
  onChange: (value: Major) => void;
}

export default function MajorSelect({ value, onChange }: MajorSelectProps) {
  return (
    <div className="space-y-1 flex-1 w-full">
      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Major Focus</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Major)}
        className="modern-input w-full cursor-pointer"
      >
        <option value="Both">Both CSE & Software</option>
        <option value="CSE">Computer Science (CSE)</option>
        <option value="Software">Software Engineering</option>
      </select>
    </div>
  );
}
