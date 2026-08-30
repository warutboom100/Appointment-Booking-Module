'use client';

import { useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAvailableSlots } from '@/hooks/useAppointments';
import { useDoctorSchedules, useDoctorOverrides } from '@/hooks/useSchedules';
import { formatDate, formatTime } from '@/lib/format';
import type { Doctor, AppointmentType, TimeSlot, DoctorSchedule, ScheduleOverride } from '@/types';

interface StepSlotPickerProps {
  doctor: Doctor;
  appointmentType: AppointmentType;
  selectedDate: string; // YYYY-MM-DD
  selectedSlot: TimeSlot | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: TimeSlot) => void;
}

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_DAYS_FULL = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
];

interface AvailableDateOption {
  dateStr: string;
  dayOfWeek: number;
  dayNameShort: string;
  dayNameFull: string;
  dayNumber: number;
  monthShort: string;
  isToday: boolean;
  isTomorrow: boolean;
  isOverrideSpecial: boolean;
  workingHours: string;
  reason?: string | null;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function formatYmd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function StepSlotPicker({
  doctor,
  appointmentType,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: StepSlotPickerProps) {
  const todayStr = useMemo(() => formatYmd(new Date()), []);

  // 1. Fetch Doctor's Recurring Schedules and Overrides
  const { data: schedules = [], isLoading: isSchedulesLoading } = useDoctorSchedules(doctor.id);
  const { data: overrides = [], isLoading: isOverridesLoading } = useDoctorOverrides(doctor.id);

  // 2. Fetch Available Slots for Selected Date
  const { data: slotData, isLoading: isSlotsLoading, error: slotError } = useAvailableSlots({
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

  // 3. Compute Doctor Working Days Summary (e.g. "จันทร์, พุธ, ศุกร์")
  const workingDaysSummary = useMemo(() => {
    if (!schedules || schedules.length === 0) return 'ยังไม่ได้ตั้งค่าตารางประจำ';
    const activeDays = schedules
      .filter((s: DoctorSchedule) => s.is_available)
      .sort((a: DoctorSchedule, b: DoctorSchedule) => a.day_of_week - b.day_of_week)
      .map((s: DoctorSchedule) => THAI_DAYS_FULL[s.day_of_week]);

    return activeDays.join(', ');
  }, [schedules]);

  // 4. Compute Next 21 Days where Doctor is Available (Recurring schedule + Overrides)
  const availableDateOptions = useMemo(() => {
    const options: AvailableDateOption[] = [];
    const today = new Date();

    for (let i = 0; i < 28; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = formatYmd(d);
      const dayOfWeek = d.getDay();

      // Check date override
      const override = overrides.find(
        (o: ScheduleOverride) => o.override_date.slice(0, 10) === dateStr,
      );

      // Check recurring schedule
      const recurring = schedules.find(
        (s: DoctorSchedule) => s.day_of_week === dayOfWeek && s.is_available,
      );

      let isAvailable = false;
      let isOverrideSpecial = false;
      let workingHours = '';
      let reason: string | null = null;

      if (override) {
        if (override.is_available) {
          isAvailable = true;
          isOverrideSpecial = true;
          workingHours = `${override.start_time?.slice(0, 5) || ''} - ${override.end_time?.slice(0, 5) || ''} น.`;
          reason = override.reason ?? null;
        } else {
          isAvailable = false; // Doctor on leave
          reason = override.reason ?? null;
        }
      } else if (recurring) {
        isAvailable = true;
        workingHours = `${recurring.start_time.slice(0, 5)} - ${recurring.end_time.slice(0, 5)} น.`;
      }

      if (isAvailable) {
        const monthShort = d.toLocaleDateString('th-TH', { month: 'short' });
        options.push({
          dateStr,
          dayOfWeek,
          dayNameShort: THAI_DAYS_SHORT[dayOfWeek],
          dayNameFull: THAI_DAYS_FULL[dayOfWeek],
          dayNumber: d.getDate(),
          monthShort,
          isToday: i === 0,
          isTomorrow: i === 1,
          isOverrideSpecial,
          workingHours,
          reason,
        });
      }
    }

    return options;
  }, [schedules, overrides]);

  // 5. Analyze Status of currently selectedDate
  const selectedDateStatus = useMemo(() => {
    if (!selectedDate) return null;
    const d = parseYmd(selectedDate);
    const dayOfWeek = d.getDay();

    const override = overrides.find(
      (o: ScheduleOverride) => o.override_date.slice(0, 10) === selectedDate,
    );
    const recurring = schedules.find(
      (s: DoctorSchedule) => s.day_of_week === dayOfWeek && s.is_available,
    );

    if (override) {
      if (override.is_available) {
        return {
          type: 'special_shift' as const,
          message: `⏰ เวรตรวจพิเศษ (${override.start_time?.slice(0, 5)} - ${override.end_time?.slice(0, 5)} น.)`,
          reason: override.reason,
          isWorking: true,
        };
      } else {
        return {
          type: 'leave' as const,
          message: `🏖️ แพทย์ลาหยุดในวันนี้: ${override.reason || 'ลาหยุด'}`,
          reason: override.reason,
          isWorking: false,
        };
      }
    }

    if (recurring) {
      return {
        type: 'regular' as const,
        message: `✓ วันออกตรวจปกติ (${recurring.start_time.slice(0, 5)} - ${recurring.end_time.slice(0, 5)} น.)`,
        isWorking: true,
      };
    }

    return {
      type: 'off_day' as const,
      message: `ℹ️ แพทย์ไม่มีตารางตรวจใน${THAI_DAYS_FULL[dayOfWeek]}`,
      isWorking: false,
    };
  }, [selectedDate, schedules, overrides]);

  // 6. Auto-select first available date if selectedDate is not available or empty
  useEffect(() => {
    if (isSchedulesLoading || isOverridesLoading) return;
    if (availableDateOptions.length > 0) {
      const isCurrentDateAvailable = availableDateOptions.some((opt) => opt.dateStr === selectedDate);
      if (!isCurrentDateAvailable && !selectedDateStatus?.isWorking) {
        onSelectDate(availableDateOptions[0].dateStr);
      }
    }
  }, [
    isSchedulesLoading,
    isOverridesLoading,
    availableDateOptions,
    selectedDate,
    selectedDateStatus,
    onSelectDate,
  ]);

  return (
    <div className="flex flex-col gap-6 animate-pop">
      {/* Doctor & Appointment Type Card */}
      <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {doctor.first_name.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--fg)]">
              {doctor.title || ''} {doctor.first_name} {doctor.last_name}
            </p>
            <p className="text-xs text-[var(--muted)]">{doctor.department_name || 'แผนกผู้ป่วยนอก'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="blue" size="md">
            🏷️ {appointmentType.name} ({appointmentType.duration_minutes} นาที)
          </Badge>
        </div>
      </div>

      {/* Doctor Regular Schedule Banner */}
      <div className="px-4 py-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
          <span className="text-base">📅</span>
          <span className="font-medium">
            ตารางออกตรวจประจำ: <strong className="font-semibold">{workingDaysSummary}</strong>
          </span>
        </div>
        <span className="text-[11px] text-teal-700 dark:text-teal-300">
          {availableDateOptions.length} วันที่พร้อมตรวจเร็วๆ นี้
        </span>
      </div>

      {/* Available Working Dates Quick Selector */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <span>✨</span>
            <span>เลือกจากวันที่แพทย์ลงตรวจจริง (Available Dates)</span>
          </label>
          <span className="text-[11px] text-[var(--muted)]">คลิกเลือกวันได้ทันที</span>
        </div>

        {isSchedulesLoading || isOverridesLoading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
            <span>กำลังโหลดตารางตรวจของแพทย์...</span>
          </div>
        ) : availableDateOptions.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
            ⚠️ ไม่พบวันที่แพทย์ออกตรวจในช่วง 28 วันข้างหน้า หรือแพทย์อาจอยู่ในช่วงลาพักงาน
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {availableDateOptions.slice(0, 14).map((opt) => {
              const isSelected = selectedDate === opt.dateStr;

              return (
                <button
                  type="button"
                  key={opt.dateStr}
                  onClick={() => onSelectDate(opt.dateStr)}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-[0.96] relative ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-500/30'
                      : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--border)] hover:border-teal-500/50 hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  {/* Special Badge tag */}
                  {opt.isToday && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full mb-1 ${
                        isSelected ? 'bg-white text-teal-800' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      วันนี้
                    </span>
                  )}
                  {opt.isTomorrow && !opt.isToday && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full mb-1 ${
                        isSelected ? 'bg-white text-teal-800' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      พรุ่งนี้
                    </span>
                  )}
                  {opt.isOverrideSpecial && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full mb-1 ${
                        isSelected ? 'bg-white text-teal-800' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      เวรพิเศษ
                    </span>
                  )}

                  <span
                    className={`text-[11px] font-medium ${
                      isSelected ? 'text-teal-100' : 'text-[var(--muted)]'
                    }`}
                  >
                    {opt.dayNameShort}
                  </span>

                  <span className="text-base font-bold tracking-tight my-0.5 font-mono">
                    {opt.dayNumber} {opt.monthShort}
                  </span>

                  <span
                    className={`text-[10px] truncate max-w-full ${
                      isSelected ? 'text-teal-100' : 'text-[var(--muted)]'
                    }`}
                  >
                    {opt.workingHours}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Date Input & Status Feedback */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            หรือระบุวันที่เจาะจง *
          </label>
          <div className="text-xs font-semibold text-[var(--fg)]">
            📅 {selectedDate ? formatDate(selectedDate) : 'ยังไม่ระบุ'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="sm:col-span-2">
            <Input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
            />
          </div>

          {/* Selected Date Status Badge */}
          <div className="sm:col-span-1">
            {selectedDateStatus && (
              <div
                className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 ${
                  selectedDateStatus.type === 'regular'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                    : selectedDateStatus.type === 'special_shift'
                    ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50'
                    : selectedDateStatus.type === 'leave'
                    ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                }`}
              >
                <span className="truncate">{selectedDateStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action suggestion if selected date is not a working day */}
        {selectedDateStatus && !selectedDateStatus.isWorking && availableDateOptions.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
            <span>แพทย์ไม่ได้ออกตรวจในวันนี้ แนะนำให้เลือกวันออกตรวจถัดไป</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSelectDate(availableDateOptions[0].dateStr)}
              className="bg-white text-amber-900 hover:bg-amber-50 border-amber-300 dark:bg-amber-900 dark:text-amber-100"
            >
              เลือกวันที่ {formatDate(availableDateOptions[0].dateStr)} ➔
            </Button>
          </div>
        )}
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

        {isSlotsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            <span>กำลังคำนวณช่วงเวลาว่างของแพทย์...</span>
          </div>
        ) : slotError ? (
          <div className="py-8 text-center rounded-2xl border border-dashed border-red-300 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 text-xs text-red-600">
            ไม่สามารถตรวจสอบช่วงเวลาว่างได้ กรุณาลองใหม่อีกครั้ง
          </div>
        ) : slots.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]">
            <p className="text-sm font-medium text-[var(--fg)]">ไม่มีช่วงเวลาว่างในวันที่เลือก</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              แพทย์อาจไม่มีตารางออกตรวจในวันดังกล่าว ลาพักร้อน หรือคิวตรวจเต็มแล้ว กรุณาเลือกวันอื่นจากปุ่มลัดด้านบน
            </p>
            {availableDateOptions.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onSelectDate(availableDateOptions[0].dateStr)}
                className="mt-3"
              >
                ✨ เลือกวันออกตรวจที่ใกล้ที่สุด ({formatDate(availableDateOptions[0].dateStr)})
              </Button>
            )}
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
