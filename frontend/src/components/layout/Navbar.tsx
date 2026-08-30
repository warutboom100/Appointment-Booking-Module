'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/Badge';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'ภาพรวมระบบ', subtitle: 'สรุปคิวและสถิติการนัดหมายวันนี้' },
  '/appointments': { title: 'รายการนัดหมาย', subtitle: 'จัดการข้อมูลคิวนัดหมายและสถานะ' },
  '/patients': { title: 'เวชระเบียนผู้ป่วย', subtitle: 'ค้นหาและจัดการประวัติคนไข้' },
  '/schedules': { title: 'ตารางตรวจแพทย์', subtitle: 'ปฏิทินตารางออกตรวจและวันหยุดแพทย์' },
  '/master-data': { title: 'ตั้งค่าระบบ', subtitle: 'จัดการข้อมูลแผนก แพทย์ และประเภทการนัดหมาย' },
};

export function Navbar({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [time, setTime] = useState<string>('');

  // Live Bangkok Time Clock (UTC+7)
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageInfo = PAGE_TITLES[pathname] || {
    title: 'ระบบนัดหมายแพทย์',
    subtitle: '',
  };

  const roleLabel =
    user?.role === 'admin'
      ? 'ผู้ดูแลระบบ'
      : user?.role === 'doctor'
      ? 'แพทย์'
      : 'เจ้าหน้าที่';

  const roleVariant =
    user?.role === 'admin'
      ? 'purple'
      : user?.role === 'doctor'
      ? 'indigo'
      : 'teal';

  return (
    <header className="sticky top-0 z-30 h-16 w-full glass-nav border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          aria-label="เปิดเมนู"
          className="md:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-subtle)] cursor-pointer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-[var(--fg)] tracking-tight leading-tight">
            {pageInfo.title}
          </h1>
          {pageInfo.subtitle && (
            <p className="hidden sm:block text-xs text-[var(--muted)]">
              {pageInfo.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Tools: Bangkok Clock, Role Pill, Theme Switcher */}
      <div className="flex items-center gap-3">
        {/* Bangkok Real-time Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--muted)] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>BKK: {time || '--:--:--'}</span>
        </div>

        {/* User Role Badge */}
        {user && (
          <Badge variant={roleVariant as 'teal' | 'purple' | 'indigo'} size="sm" dot>
            {roleLabel}
          </Badge>
        )}

        {/* Apple-style Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
