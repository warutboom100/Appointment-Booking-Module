'use client';

import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  subMessage?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = 'ยืนยันการลบ',
  message,
  subMessage = 'การดำเนินการนี้ไม่สามารถย้อนกลับได้',
  confirmLabel = 'ลบรายการ',
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6 animate-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] w-full max-w-[380px] transition-colors animate-pop shadow-[var(--shadow-lg)] overflow-hidden">
        {/* แถบเตือนบนสุด */}
        <div className="h-1 bg-[var(--danger)]" />

        <div className="px-6 pt-6 pb-5 text-center">
          {/* ไอคอนถังขยะในวงแหวนแดง */}
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 ring-8 ring-red-500/5 text-[var(--danger)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
            </svg>
          </div>

          <h2 className="text-[17px] font-semibold tracking-tight mb-1.5">{title}</h2>
          <p className="text-[14px] leading-relaxed mb-1">{message}</p>
          <p className="text-[12.5px] text-[var(--muted)]">{subMessage}</p>
        </div>

        {/* ปุ่มคู่เต็มกว้าง — ยกเลิกอยู่ซ้าย (ปลอดภัยกว่า) */}
        <div className="grid grid-cols-2 gap-2.5 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="py-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-sm font-medium cursor-pointer text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-60"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
            className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[var(--danger)] text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {isLoading ? 'กำลังลบ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
