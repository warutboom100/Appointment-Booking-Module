'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, getErrorMessage } from '@/features/auth/auth.store';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hydrate, isHydrated } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/');
    }
  }, [isHydrated, isAuthenticated, router]);

  const validate = (): boolean => {
    const e: { username?: string; password?: string } = {};
    if (!username.trim()) e.username = 'กรุณากรอกชื่อผู้ใช้';
    if (!password) e.password = 'กรุณากรอกรหัสผ่าน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      router.push('/');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-[40px_36px] w-full max-w-[400px] transition-colors shadow-[var(--shadow-md)] animate-pop max-[440px]:p-[28px_20px] max-[440px]:rounded-none max-[440px]:border-x-0">
      {/* Logo */}
      <div className="mb-7">
        <Logo subtitle="ระบบนัดหมายแพทย์" size={38} />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">เข้าสู่ระบบ</h1>
      <p className="text-sm text-[var(--muted)] mb-8">กรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>

      {serverError && (
        <div className="mb-5 px-3.5 py-2.5 rounded-lg text-[13px] bg-red-500/8 text-[var(--danger)] border border-red-500/15">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5">
          <label htmlFor="username" className="block text-[13px] font-medium mb-1.5 text-[var(--fg)]">
            ชื่อผู้ใช้
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
              if (serverError) setServerError('');
            }}
            placeholder="กรอกชื่อผู้ใช้"
            autoComplete="username"
            className={`w-full px-3.5 py-2.5 border rounded-lg text-[15px] bg-[var(--bg)] text-[var(--fg)] outline-none transition-[border-color,box-shadow] ${
              errors.username ? 'border-[var(--danger)]' : 'border-[var(--border)]'
            }`}
          />
          {errors.username && <p className="text-[12px] text-[var(--danger)] mt-1">{errors.username}</p>}
        </div>

        <div className="mb-5">
          <label htmlFor="password" className="block text-[13px] font-medium mb-1.5 text-[var(--fg)]">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              if (serverError) setServerError('');
            }}
            placeholder="กรอกรหัสผ่าน"
            autoComplete="current-password"
            className={`w-full px-3.5 py-2.5 border rounded-lg text-[15px] bg-[var(--bg)] text-[var(--fg)] outline-none transition-[border-color,box-shadow] ${
              errors.password ? 'border-[var(--danger)]' : 'border-[var(--border)]'
            }`}
          />
          {errors.password && <p className="text-[12px] text-[var(--danger)] mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg bg-[var(--accent)] text-white text-[15px] font-medium cursor-pointer border-none hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <div className="text-center mt-5 text-sm text-[var(--muted)]">
        ยังไม่มีบัญชี?{' '}
        <Link href="/register" className="text-[var(--accent)] font-medium no-underline hover:underline">
          สมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}
