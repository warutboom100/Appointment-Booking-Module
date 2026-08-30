'use client';

import { type ReactNode } from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const containerSizeClass = size === 'sm' ? 'p-0.5 rounded-lg text-xs' : 'p-1 rounded-xl text-sm';
  const itemSizeClass = size === 'sm' ? 'px-2.5 py-1' : 'px-3.5 py-1.5';

  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-[var(--surface-subtle)] border border-[var(--border-subtle)] ${containerSizeClass} select-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            role="tab"
            aria-selected={isSelected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-200 ease-out cursor-pointer ${itemSizeClass} ${
              isSelected
                ? 'bg-[var(--surface)] text-[var(--fg)] shadow-xs font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-black/2 dark:hover:bg-white/2'
            } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.97]'}`}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-[var(--surface-subtle)] text-[var(--fg)]'
                    : 'bg-black/5 dark:bg-white/5 text-[var(--muted)]'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
