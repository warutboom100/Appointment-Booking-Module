'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, getErrorMessage } from '@/features/auth/auth.store';
import { Logo } from '@/components/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'กรุณากรอกชื่อ-นามสกุล';
    if (!username.trim() || username.trim().length < 3) e.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    if (!password || password.length < 6) e.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
    setServerError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register({ name: name.trim(), username: username.trim(), password });
      setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...');
      setTimeout(() => router.push('/login'), 1500);
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

      <h1 className="text-2xl font-semibold tracking-tight mb-1">สมัครสมาชิก</h1>
      <p className="text-sm text-[var(--muted)] mb-8">สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบ</p>

      {serverError && (
        <div className="mb-5 px-3.5 py-2.5 rounded-lg text-[13px] bg-red-500/8 text-[var(--danger)] border border-red-500/15">
          {serverError}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 px-3.5 py-2.5 rounded-lg text-[13px] bg-green-500/8 text-[var(--success)] border border-green-500/15">
          {successMsg}
        </div>
      )}

      {!successMsg && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="name" className="block text-[13px] font-medium mb-1.5">
              ชื่อ-นามสกุล
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); clearErrors(); }}
              placeholder="กรอกชื่อ-นามสกุล"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-[15px] bg-[var(--bg)] text-[var(--fg)] outline-none transition-[border-color,box-shadow] ${
                errors.name ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              }`}
            />
            {errors.name && <p className="text-[12px] text-[var(--danger)] mt-1">{errors.name}</p>}
          </div>

          <div className="mb-5">
            <label htmlFor="username" className="block text-[13px] font-medium mb-1.5">
              ชื่อผู้ใช้
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearErrors(); }}
              placeholder="กรอกชื่อผู้ใช้"
              autoComplete="username"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-[15px] bg-[var(--bg)] text-[var(--fg)] outline-none transition-[border-color,box-shadow] ${
                errors.username ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              }`}
            />
            <p className="text-[11px] text-[var(--muted)] mt-1">อย่างน้อย 3 ตัวอักษร</p>
            {errors.username && <p className="text-[12px] text-[var(--danger)] mt-0.5">{errors.username}</p>}
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="block text-[13px] font-medium mb-1.5">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
              placeholder="กรอกรหัสผ่าน"
              autoComplete="new-password"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-[15px] bg-[var(--bg)] text-[var(--fg)] outline-none transition-[border-color,box-shadow] ${
                errors.password ? 'border-[var(--danger)]' : 'border-[var(--border)]'
              }`}
            />
            <p className="text-[11px] text-[var(--muted)] mt-1">อย่างน้อย 6 ตัวอักษร</p>
            {errors.password && <p className="text-[12px] text-[var(--danger)] mt-0.5">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-[var(--accent)] text-white text-[15px] font-medium cursor-pointer border-none hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>
      )}

      <div className="text-center mt-5 text-sm text-[var(--muted)]">
        มีบัญชีอยู่แล้ว?{' '}
        <Link href="/login" className="text-[var(--accent)] font-medium no-underline hover:underline">
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
