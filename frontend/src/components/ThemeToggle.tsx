'use client';

import { useEffect, useState } from 'react';
import { setStoredTheme } from '@/lib/storage';

export function ThemeToggle({ className = '' }: { className?: string }) {
  // sync ไอคอนกับ data-theme ที่ตั้งไว้ก่อน hydrate (อ่านหลัง mount กัน SSR mismatch)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setStoredTheme(next);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      title="สลับธีม"
      aria-label="สลับธีมสว่าง/มืด"
      className={`group flex items-center justify-center w-[34px] h-[34px] rounded-[7px] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] cursor-pointer transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-transform duration-300 group-hover:rotate-45"
      >
        {isDark ? (
          // ดวงจันทร์
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor" stroke="none" />
        ) : (
          // ดวงอาทิตย์
          <>
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
          </>
        )}
      </svg>
    </button>
  );
}
