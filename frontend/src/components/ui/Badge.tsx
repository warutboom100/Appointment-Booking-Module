import { type ReactNode } from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'amber'
  | 'purple'
  | 'emerald'
  | 'rose';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1 rounded-md font-medium',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-medium',
  }[size];

  const variantClasses = {
    neutral:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-300/40 dark:ring-slate-700/40',
    teal:
      'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 ring-1 ring-teal-500/20',
    blue:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 ring-1 ring-blue-500/20',
    indigo:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 ring-1 ring-indigo-500/20',
    amber:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-amber-500/20',
    purple:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 ring-1 ring-purple-500/20',
    emerald:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-500/20',
    rose:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 ring-1 ring-rose-500/20',
  }[variant];

  const dotClasses = {
    neutral: 'bg-slate-400',
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center tracking-tight transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />}
      {children}
    </span>
  );
}
