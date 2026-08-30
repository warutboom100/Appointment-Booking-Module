import { type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-subtle)] shadow-xs mb-3.5 text-xl">
        {icon || (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      <h3 className="text-base font-semibold text-[var(--fg)] tracking-tight mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-[var(--muted)] max-w-sm mb-5">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
