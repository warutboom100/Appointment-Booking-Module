'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <svg
        className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ค้นหา ทะเบียน, จังหวัด, ยี่ห้อ, รุ่น..."
        className="w-full py-2.5 pl-9 pr-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] text-sm outline-none transition-[border-color,box-shadow]"
      />
    </div>
  );
}
