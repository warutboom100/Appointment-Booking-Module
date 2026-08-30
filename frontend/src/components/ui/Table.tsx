import { type ReactNode, type TableHTMLAttributes } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'ไม่พบข้อมูล',
  onRowClick,
  className = '',
  ...props
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
      <table className={`w-full text-left text-sm border-collapse ${className}`} {...props}>
        <thead>
          <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[12px] uppercase font-semibold text-[var(--muted)] tracking-wider">
            {columns.map((col) => {
              const alignClass =
                col.align === 'center'
                  ? 'text-center'
                  : col.align === 'right'
                  ? 'text-right'
                  : 'text-left';
              return (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 first:pl-6 last:pr-6 select-none ${alignClass} ${
                    col.headerClassName || ''
                  }`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--muted)]">
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="w-7 h-7 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                  <span className="text-xs">กำลังโหลดข้อมูล...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-sm text-[var(--muted)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[var(--surface-subtle)] active:bg-[var(--border-subtle)]'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
              >
                {columns.map((col) => {
                  const alignClass =
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left';
                  return (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 first:pl-6 last:pr-6 text-[var(--fg)] ${alignClass} ${
                        col.className || ''
                      }`}
                    >
                      {col.render ? col.render(row, index) : (row as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
