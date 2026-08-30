import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      optional,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
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
          {leftIcon && (
            <div className="absolute left-3.5 text-[var(--muted)] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full px-3.5 py-2 text-sm bg-[var(--surface)] text-[var(--fg)] border rounded-xl placeholder:text-[var(--muted)] placeholder:opacity-60 transition-all duration-150 ease-out outline-none ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-2 focus:ring-red-500/20'
                : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--ring)]'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-[var(--muted)] flex items-center">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
