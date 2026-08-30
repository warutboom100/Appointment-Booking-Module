'use client';

import { useState, useEffect } from 'react';
import { Input } from './Input';

export interface TimeInputProps {
  label?: string;
  value: string; // HH:MM
  onChange: (value: string) => void;
  error?: string;
  optional?: boolean;
}

export function TimeInput({ label, value, onChange, error, optional }: TimeInputProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and colon
    let val = e.target.value.replace(/[^\d:]/g, '');
    
    // Auto-insert colon after 2 digits if typing forward
    if (val.length === 2 && !val.includes(':') && internalValue.length < val.length) {
      val += ':';
    }
    
    // Prevent typing more than 5 chars
    if (val.length > 5) {
      val = val.slice(0, 5);
    }

    setInternalValue(val);
    
    // If it's a valid complete time, trigger onChange
    if (val.length === 5) {
      const [h, m] = val.split(':');
      if (parseInt(h, 10) <= 23 && parseInt(m, 10) <= 59) {
        onChange(val);
      }
    } else if (val.length === 0) {
      onChange('');
    }
  };

  const handleBlur = () => {
    // Format properly on blur if partially filled
    if (internalValue.length > 0 && internalValue.length < 5) {
      let [h, m] = internalValue.split(':');
      if (!m) m = '00';
      if (h.length === 1) h = `0${h}`;
      if (m.length === 1) m = `0${m}`;
      
      // Ensure validity
      let hr = parseInt(h, 10);
      let min = parseInt(m, 10);
      if (isNaN(hr)) hr = 0;
      if (isNaN(min)) min = 0;
      if (hr > 23) hr = 23;
      if (min > 59) min = 59;
      
      const finalH = hr.toString().padStart(2, '0');
      const finalM = min.toString().padStart(2, '0');
      const final = `${finalH}:${finalM}`;
      
      setInternalValue(final);
      onChange(final);
    } else if (internalValue.length === 5) {
      // Just to trigger a safe valid format
      const [h, m] = internalValue.split(':');
      let hr = parseInt(h, 10);
      let min = parseInt(m, 10);
      if (hr > 23) hr = 23;
      if (min > 59) min = 59;
      const finalH = hr.toString().padStart(2, '0');
      const finalM = min.toString().padStart(2, '0');
      const final = `${finalH}:${finalM}`;
      setInternalValue(final);
      onChange(final);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      label={label}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="HH:MM (เช่น 09:00)"
      error={error}
      optional={optional}
      maxLength={5}
    />
  );
}
