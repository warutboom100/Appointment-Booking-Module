'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/auth.store';
import { Logo } from '@/components/Logo';

interface NavItem {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  roles: ('admin' | 'receptionist' | 'doctor')[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'ภาพรวมระบบ (Dashboard)',
    href: '/',
    roles: ['admin', 'receptionist', 'doctor'],
    icon: (active) => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.25' : '1.75'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    label: 'รายการนัดหมาย (Appointments)',
    href: '/appointments',
    roles: ['admin', 'receptionist', 'doctor'],
    icon: (active) => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.25' : '1.75'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'ข้อมูลผู้ป่วย (Patients)',
    href: '/patients',
    roles: ['admin', 'receptionist', 'doctor'],
    icon: (active) => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.25' : '1.75'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'ตารางตรวจแพทย์ (Schedules)',
    href: '/schedules',
    roles: ['admin', 'receptionist', 'doctor'],
    icon: (active) => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.25' : '1.75'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'ตั้งค่าระบบ (Master Data)',
    href: '/master-data',
    roles: ['admin'],
    icon: (active) => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.25' : '1.75'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export function Sidebar({
  onOpenBooking,
  className = '',
}: {
  onOpenBooking?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const role = user?.role || 'receptionist';

  const accessibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside
      className={`w-64 h-screen flex flex-col justify-between border-r border-[var(--border)] bg-[var(--surface)] p-4 select-none ${className}`}
    >
      {/* Brand & Top Action */}
      <div className="flex flex-col gap-5">
        <div className="px-2 pt-2">
          <Logo subtitle="ระบบนัดหมายแพทย์" size={34} />
        </div>

        {/* Quick Booking Button (Staff & Admin) */}
        {role !== 'doctor' && (
          <button
            onClick={onOpenBooking}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-medium text-sm shadow-sm hover:shadow-[0_4px_16px_rgba(13,148,136,0.35)] transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ นัดหมายใหม่</span>
          </button>
        )}

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          {accessibleNavItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-out no-underline ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 font-semibold shadow-2xs'
                    : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <div
                  className={`flex items-center justify-center ${
                    isActive ? 'text-teal-600 dark:text-teal-400' : 'text-current'
                  }`}
                >
                  {item.icon(isActive)}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Card */}
      <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-[var(--surface-subtle)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center uppercase shadow-xs">
            {user?.name ? user.name.slice(0, 2) : 'US'}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-semibold text-[var(--fg)] truncate">
              {user?.name || 'ผู้ใช้งาน'}
            </span>
            <span className="text-[11px] text-[var(--muted)] capitalize">
              {user?.role === 'admin'
                ? 'ผู้ดูแลระบบ (Admin)'
                : user?.role === 'doctor'
                ? 'แพทย์ (Doctor)'
                : 'เจ้าหน้าที่ (Staff)'}
            </span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/8 rounded-lg transition-colors cursor-pointer border border-transparent"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
