import Link from 'next/link';

export interface LogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export function Logo({
  size = 32,
  showText = true,
  subtitle = 'Hospital Care',
  className = '',
}: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 text-inherit no-underline select-none group ${className}`}
    >
      {/* Apple-style Medical Cross / Pulse Icon with Teal Gradient */}
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm group-hover:shadow-[0_4px_12px_rgba(13,148,136,0.35)] transition-all duration-200"
      >
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Medical Cross with Heartbeat Wave */}
          <path d="M12 3v5m0 8v5M3 12h5m8 0h5" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
            MedBook
          </span>
          <span className="text-[11px] font-medium text-[var(--muted)] tracking-normal">
            {subtitle}
          </span>
        </div>
      )}
    </Link>
  );
}
