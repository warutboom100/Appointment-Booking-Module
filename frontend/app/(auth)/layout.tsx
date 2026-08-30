import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-[var(--bg)] transition-colors">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
