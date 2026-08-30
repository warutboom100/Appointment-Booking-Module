'use client';

import { useEffect, type ReactNode } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: ReactNode;
  subMessage?: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = 'ยืนยันการดำเนินการ',
  message,
  subMessage = 'การดำเนินการนี้ไม่สามารถย้อนกลับได้',
  confirmLabel = 'ยืนยัน',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel, isLoading]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Frosted glass backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      />

      {/* Dialog box */}
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl sm:rounded-3xl w-full max-w-[400px] transition-colors animate-pop shadow-[var(--shadow-modal)] overflow-hidden z-10">
        {/* Top Accent Strip */}
        <div className={`h-1.5 ${isDanger ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'}`} />

        <div className="px-6 pt-6 pb-5 text-center">
          {/* Circular Badge Icon */}
          <div
            className={`mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full ring-8 ${
              isDanger
                ? 'bg-red-500/10 ring-red-500/5 text-[var(--danger)]'
                : 'bg-teal-500/10 ring-teal-500/5 text-[var(--accent)]'
            }`}
          >
            {isDanger ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>

          <h2 className="text-lg font-bold tracking-tight text-[var(--fg)] mb-1.5">{title}</h2>
          <div className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-1">{message}</div>
          {subMessage && (
            <p className="text-xs text-[var(--muted)] mt-1">{subMessage}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="py-2.5 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-subtle)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-[var(--danger)] hover:opacity-95 ring-2 ring-red-500/20'
                : 'bg-[var(--accent)] hover:opacity-95 ring-2 ring-teal-500/20'
            }`}
          >
            {isLoading && (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {isLoading ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
