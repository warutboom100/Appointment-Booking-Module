
export const TIMEZONE = 'Asia/Bangkok';

export const now = (): Date => new Date();
export const formatThai = (value: Date | string): string =>
  new Date(value).toLocaleString('th-TH', { timeZone: TIMEZONE });
