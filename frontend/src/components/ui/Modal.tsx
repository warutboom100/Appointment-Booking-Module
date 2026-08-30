'use client';

import { useEffect, type ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
  showCloseButton = true,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Apple-style Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-overlay"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative w-full ${maxWidthClasses} bg-[var(--surface)] border border-[var(--border)] rounded-2xl sm:rounded-3xl shadow-[var(--shadow-modal)] overflow-hidden z-10 animate-pop`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface)]">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-[var(--fg)] tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="ปิดหน้าต่าง"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer active:scale-95"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
