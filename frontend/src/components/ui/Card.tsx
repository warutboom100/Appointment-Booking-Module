import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'subtle' | 'outline';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hoverable = false, className = '', ...props }, ref) => {
    const variantClasses = {
      default:
        'bg-[var(--surface)] border border-[var(--border)] shadow-xs',
      glass:
        'glass shadow-sm',
      subtle:
        'bg-[var(--surface-subtle)] border border-[var(--border-subtle)]',
      outline:
        'bg-transparent border border-[var(--border)]',
    }[variant];

    const hoverClass = hoverable
      ? 'hover:shadow-md hover:border-[var(--border)] transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]'
      : '';

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-5 ${variantClasses} ${hoverClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-[var(--fg)] tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
