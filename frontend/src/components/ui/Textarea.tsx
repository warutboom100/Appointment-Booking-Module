import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  optional?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, optional, className = '', id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="text-[13px] font-medium text-[var(--fg)] tracking-tight"
            >
              {label}
            </label>
            {optional && (
              <span className="text-[11px] text-[var(--muted)]">ไม่บังคับ</span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full px-3.5 py-2 text-sm bg-[var(--surface)] text-[var(--fg)] border rounded-xl placeholder:text-[var(--muted)] placeholder:opacity-60 transition-all duration-150 ease-out outline-none resize-y ${
            error
              ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-2 focus:ring-red-500/20'
              : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--ring)]'
          } ${className}`}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
