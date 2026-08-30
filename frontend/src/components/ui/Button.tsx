import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      type = 'button',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    // Base Apple-style button classes
    const baseClasses =
      'relative inline-flex items-center justify-center font-medium transition-all duration-150 ease-out select-none cursor-pointer border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98]';

    // Size variants
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
      md: 'px-4 py-2 text-sm gap-2 rounded-xl',
      lg: 'px-5 py-2.5 text-base gap-2.5 rounded-2xl',
    }[size];

    // Color variants
    const variantClasses = {
      primary:
        'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-transparent shadow-sm hover:shadow-[0_4px_12px_var(--accent-glow)]',
      secondary:
        'bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--fg)] border-[var(--border)] shadow-xs',
      outline:
        'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--fg)] border-[var(--border)]',
      ghost:
        'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--muted)] hover:text-[var(--fg)] border-transparent',
      danger:
        'bg-[var(--danger)] hover:opacity-90 text-white border-transparent shadow-sm hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
