'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAvailableSlots } from '@/hooks/useAppointments';
import { formatDate, formatTime } from '@/lib/format';
import type { Doctor, AppointmentType, TimeSlot } from '@/types';

interface StepSlotPickerProps {
  doctor: Doctor;
  appointmentType: AppointmentType;
  selectedDate: string; // YYYY-MM-DD
  selectedSlot: TimeSlot | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: TimeSlot) => void;
}

export function StepSlotPicker({
  doctor,
  appointmentType,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: StepSlotPickerProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { data: slotData, isLoading, error } = useAvailableSlots({
    doctor_id: doctor.id,
    date: selectedDate,
    appointment_type_id: appointmentType.id,
  });

  const slots = slotData?.slots || [];

  // Group slots into Morning (<12:00) and Afternoon (>=12:00)
  const { morningSlots, afternoonSlots } = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];

    slots.forEach((s) => {
      const hour = parseInt(s.start_time.split(':')[0], 10);
      if (hour < 12) {
        morning.push(s);
      } else {
        afternoon.push(s);
      }
    });

    return { morningSlots: morning, afternoonSlots: afternoon };
  }, [slots]);

  return (
    <div className="flex flex-col gap-6 animate-pop">
      {/* Doctor & Type Info Strip */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
            {doctor.first_name.slice(0, 1)}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--fg)]">
              {doctor.title || ''} {doctor.first_name} {doctor.last_name}
            </p>
            <p className="text-[11px] text-[var(--muted)]">{doctor.department_name || 'แผนกผู้ป่วยนอก'}</p>
          </div>
        </div>

        <Badge variant="blue" size="sm">
          🏷️ {appointmentType.name} ({appointmentType.duration_minutes} นาที)
        </Badge>
      </div>

      {/* Date Picker Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          เลือกวันที่ต้องการนัดตรวจ *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="sm:col-span-2">
            <Input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
            />
          </div>
          <div className="text-xs text-[var(--muted)] sm:text-right font-medium">
            📅 {selectedDate ? formatDate(selectedDate) : 'ยังไม่ระบุ'}
          </div>
        </div>
      </div>

      {/* Slots Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            ช่วงเวลาที่แพทย์ว่าง (Available Time Slots) *
          </label>
          {slots.length > 0 && (
            <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">
              ว่าง {slots.length} ช่วงเวลา
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            <span>กำลังคำนวณช่วงเวลาว่างของแพทย์...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center rounded-2xl border border-dashed border-red-300 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 text-xs text-red-600">
            ไม่สามารถตรวจสอบช่วงเวลาว่างได้ กรุณาลองใหม่อีกครั้ง
          </div>
        ) : slots.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]">
            <p className="text-sm font-medium text-[var(--fg)]">ไม่มีช่วงเวลาว่างในวันที่เลือก</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              แพทย์อาจไม่มีตารางออกตรวจในวันดังกล่าว ลาพักร้อน หรือคิวตรวจเต็มแล้ว กรุณาเลือกวันอื่น
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Morning Slots */}
            {morningSlots.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--fg-secondary)] flex items-center gap-1.5">
                  <span>☀️ ช่วงเช้า (Morning)</span>
                  <span className="text-[11px] text-[var(--muted)]">({morningSlots.length} ช่วง)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {morningSlots.map((slot) => {
                    const isSelected =
                      selectedSlot?.start_time === slot.start_time &&
                      selectedSlot?.end_time === slot.end_time;

                    return (
                      <button
                        type="button"
                        key={slot.start_time}
                        onClick={() => onSelectSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer active:scale-[0.97] ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-500/30'
                            : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--border)] hover:border-teal-500/50 hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)} น.
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon Slots */}
            {afternoonSlots.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--fg-secondary)] flex items-center gap-1.5">
                  <span>🌤️ ช่วงบ่าย (Afternoon)</span>
                  <span className="text-[11px] text-[var(--muted)]">({afternoonSlots.length} ช่วง)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {afternoonSlots.map((slot) => {
                    const isSelected =
                      selectedSlot?.start_time === slot.start_time &&
                      selectedSlot?.end_time === slot.end_time;

                    return (
                      <button
                        type="button"
                        key={slot.start_time}
                        onClick={() => onSelectSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer active:scale-[0.97] ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-500/30'
                            : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--border)] hover:border-teal-500/50 hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)} น.
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
