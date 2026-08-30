import type { Gender } from '@/types';

/**
 * Format date in Thai locale e.g. "15 ม.ค. 2567"
 */
export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);

  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
}

/**
 * Format time from HH:MM:SS to HH:MM (24-hour format)
 */
export function formatTime(timeString?: string | null): string {
  if (!timeString) return '';
  return timeString.slice(0, 5);
}

/**
 * Format full date and time e.g. "15 ม.ค. 2567 14:30 น."
 */
export function formatDateTime(value: string | Date | undefined | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);

  return `${d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  })} ${d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  })} น.`;
}

/**
 * Calculate age from Date of Birth (YYYY-MM-DD)
 */
export function calculateAge(dobString: string | undefined | null): number | null {
  if (!dobString) return null;
  const parts = dobString.slice(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) {
    const fallback = new Date(dobString);
    if (isNaN(fallback.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - fallback.getFullYear();
    const m = today.getMonth() - fallback.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < fallback.getDate())) age--;
    return Math.max(0, age);
  }

  const [y, m, d] = parts;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Format gender to Thai label
 */
export function genderLabel(gender: Gender | string | undefined | null): string {
  switch (gender) {
    case 'male':
      return 'ชาย';
    case 'female':
      return 'หญิง';
    case 'other':
      return 'อื่นๆ';
    default:
      return '-';
  }
}

/**
 * Format phone number e.g. 0812345678 -> 081-234-5678
 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Appointment Status Metadata (Label & Badge Variant)
 */
export function getAppointmentStatusMeta(status: string): {
  label: string;
  variant: 'blue' | 'teal' | 'amber' | 'indigo' | 'emerald' | 'rose' | 'purple' | 'neutral';
} {
  switch (status) {
    case 'booked':
      return { label: 'นัดหมายแล้ว', variant: 'blue' };
    case 'confirmed':
      return { label: 'ยืนยันนัดหมาย', variant: 'teal' };
    case 'checked_in':
      return { label: 'มาถึงแล้ว (รอตรวจ)', variant: 'amber' };
    case 'in_progress':
      return { label: 'กำลังตรวจ', variant: 'indigo' };
    case 'completed':
      return { label: 'ตรวจเสร็จสิ้น', variant: 'emerald' };
    case 'cancelled':
      return { label: 'ยกเลิกแล้ว', variant: 'rose' };
    case 'no_show':
      return { label: 'ไม่มาตามนัด', variant: 'neutral' };
    case 'rescheduled':
      return { label: 'เลื่อนนัดแล้ว', variant: 'purple' };
    default:
      return { label: status, variant: 'neutral' };
  }
}
