'use client';

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  leaving?: boolean;
}

export interface ToastOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback(
    ({ title, description, type = 'info' }: ToastOptions) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, type: 'success' }),
    [addToast],
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, type: 'error' }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, success, error, removeToast }}>
      {children}
      {/* Apple-style floating toast container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[200] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((t) => {
          const typeIcons = {
            success: '✅',
            error: '✕',
            warning: '⚠️',
            info: 'ℹ️',
          }[t.type];

          const borderColors = {
            success: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
            error: 'border-rose-500/30 text-rose-600 dark:text-rose-400',
            warning: 'border-amber-500/30 text-amber-600 dark:text-amber-400',
            info: 'border-blue-500/30 text-blue-600 dark:text-blue-400',
          }[t.type];

          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto flex items-start gap-3 w-full
                rounded-2xl border bg-[var(--surface)] p-4
                shadow-[var(--shadow-md)] backdrop-blur-xl transition-all
                ${borderColors}
                ${t.leaving ? 'animate-slide-out' : 'animate-slide-in'}
              `}
            >
              <span className="text-base shrink-0 select-none mt-0.5">{typeIcons}</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--fg)] tracking-tight">
                  {t.title}
                </span>
                {t.description && (
                  <span className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
                    {t.description}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[var(--muted)] hover:text-[var(--fg)] p-0.5 rounded-md transition-colors cursor-pointer"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
