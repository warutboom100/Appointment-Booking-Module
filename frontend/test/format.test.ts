import { describe, it, expect } from 'vitest';
import { calculateAge, genderLabel, formatPhone, formatDate } from '@/lib/format';

describe('Hospital Format Utilities', () => {
  it('calculates age correctly from date of birth', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const dob = `${birthYear}-01-15`;
    const age = calculateAge(dob);
    expect(age).toBe(25);
  });

  it('returns null for empty or invalid DOB', () => {
    expect(calculateAge('')).toBeNull();
    expect(calculateAge(null)).toBeNull();
    expect(calculateAge('invalid-date')).toBeNull();
  });

  it('formats gender to Thai text correctly', () => {
    expect(genderLabel('male')).toBe('ชาย');
    expect(genderLabel('female')).toBe('หญิง');
    expect(genderLabel('other')).toBe('อื่นๆ');
    expect(genderLabel(null)).toBe('-');
  });

  it('formats Thai phone numbers correctly', () => {
    expect(formatPhone('0812345678')).toBe('081-234-5678');
    expect(formatPhone('021234567')).toBe('02-123-4567');
    expect(formatPhone(null)).toBe('-');
  });

  it('formats dates safely', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('2024-05-20')).toContain('2567');
  });
});
