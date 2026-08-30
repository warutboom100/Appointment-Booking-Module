import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Option[];
  placeholder?: string;
  optional?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder,
      optional,
      className = '',
      id,
      children,
      ...props
    },
    ref,
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={selectId}
              className="text-[13px] font-medium text-[var(--fg)] tracking-tight"
            >
              {label}
            </label>
            {optional && (
              <span className="text-[11px] text-[var(--muted)]">ไม่บังคับ</span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none px-3.5 py-2 pr-10 text-sm bg-[var(--surface)] text-[var(--fg)] border rounded-xl transition-all duration-150 ease-out outline-none cursor-pointer ${
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-2 focus:ring-red-500/20'
                : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--ring)]'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          {/* Apple-style dropdown chevron */}
          <div className="absolute right-3.5 pointer-events-none text-[var(--muted)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {error && (
          <p className="text-[12px] text-[var(--danger)] font-medium mt-0.5 animate-pop">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-[12px] text-[var(--muted)] mt-0.5">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
