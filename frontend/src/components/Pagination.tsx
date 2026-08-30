'use client';

import type { PaginationMeta } from '@/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ meta, onPageChange, onLimitChange }: PaginationProps) {
  const { page, limit, total, totalPages } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);


  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      totalPages <= 7 ||
      i === 1 ||
      i === totalPages ||
      Math.abs(i - page) <= 1
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-[13px] text-[var(--muted)] flex-wrap gap-3">
      <div>
        แสดง {from}–{to} จาก {total} รายการ
      </div>

      <div className="flex items-center gap-3">
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="py-1 px-2 border border-[var(--border)] rounded-md text-xs bg-[var(--surface)] text-[var(--fg)] cursor-pointer"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} ต่อหน้า
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            ◀
          </PageBtn>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="px-1 text-[var(--muted)]">
                …
              </span>
            ) : (
              <PageBtn
                key={p}
                active={p === page}
                onClick={() => onPageChange(p)}
              >
                {p}
              </PageBtn>
            ),
          )}
          <PageBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            ▶
          </PageBtn>
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-8 h-8 rounded-md border text-[13px] cursor-pointer transition-colors
        ${active
          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface-hover)]'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}
