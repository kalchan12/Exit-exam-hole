'use client';

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function InputGroup({ label, value, onChange, placeholder, required = false }: InputGroupProps) {
  return (
    <div className="space-y-1 flex-1 w-full">
      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
        {label} {required && <span className="text-accent-purple">*</span>}
      </label>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="modern-input w-full"
        placeholder={placeholder}
      />
    </div>
  );
}
