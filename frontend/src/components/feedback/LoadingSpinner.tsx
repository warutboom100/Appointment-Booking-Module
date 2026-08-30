export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-3',
  }[size];

  return (
    <div
      className={`rounded-full border-[var(--accent)] border-t-transparent animate-spin ${sizeClasses} ${className}`}
      role="status"
      aria-label="กำลังโหลด"
    />
  );
}

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    rectangular: 'w-full rounded-xl',
    circular: 'rounded-full',
  }[variant];

  return (
    <div
      className={`bg-[var(--border)] opacity-60 animate-[skeleton_1.5s_ease-in-out_infinite] ${variantClasses} ${className}`}
    />
  );
}
