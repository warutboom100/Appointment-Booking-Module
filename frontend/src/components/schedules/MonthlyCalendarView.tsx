'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DayScheduleDrawer, type DayShiftInfo } from './DayScheduleDrawer';
import type { Doctor, DoctorSchedule, ScheduleOverride } from '@/types';

export interface MonthlyCalendarViewProps {
  doctors: Doctor[];
  allSchedules: Record<string, DoctorSchedule[]>;
  allOverrides: Record<string, ScheduleOverride[]>;
  onAddOverrideForDate?: (date: string) => void;
}

const MONTH_NAMES_THAI = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const WEEKDAY_NAMES_THAI = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export function MonthlyCalendarView({
  doctors,
  allSchedules,
  allOverrides,
  onAddOverrideForDate,
}: MonthlyCalendarViewProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    date: string;
    shifts: DayShiftInfo[];
  } | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const getShiftsForDate = (dateStr: string, dayOfWeek: number): DayShiftInfo[] => {
    const shifts: DayShiftInfo[] = [];

    doctors.forEach((doc) => {
      const docSchedules = allSchedules[doc.id] || [];
      const docOverrides = allOverrides[doc.id] || [];

      const override = docOverrides.find((o) => o.override_date === dateStr);
      const schedule = docSchedules.find((s) => s.day_of_week === dayOfWeek);

      if (override) {
        shifts.push({
          doctor: doc,
          override,
          schedule,
          isAvailable: override.is_available,
          statusText: override.is_available
            ? `⭐ ${override.start_time}-${override.end_time}`
            : '🏖️ ลาหยุด',
        });
      } else if (schedule) {
        shifts.push({
          doctor: doc,
          schedule,
          isAvailable: schedule.is_available,
          statusText: `${schedule.start_time}-${schedule.end_time}`,
        });
      }
    });

    return shifts;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--fg)]">
            {MONTH_NAMES_THAI[currentMonth]} {currentYear + 543}
          </h3>
          <Button variant="outline" size="sm" onClick={goToToday}>
            วันนี้
          </Button>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button variant="secondary" size="sm" onClick={prevMonth} aria-label="เดือนก่อนหน้า">
            ◀ ก่อนหน้า
          </Button>
          <Button variant="secondary" size="sm" onClick={nextMonth} aria-label="เดือนถัดไป">
            ถัดไป ▶
          </Button>
        </div>
      </div>

      {/* 7x5 Calendar Grid */}
      <Card variant="default" className="p-0 overflow-hidden shadow-sm">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-subtle)] text-center text-xs font-semibold text-[var(--muted)]">
          {WEEKDAY_NAMES_THAI.map((name, i) => (
            <div
              key={name}
              className={`py-3 border-r last:border-r-0 border-[var(--border-subtle)] ${
                i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : ''
              }`}
            >
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{name.slice(0, 2)}</span>
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[var(--border-subtle)]">
          {/* Leading days */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => {
            const dayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
            return (
              <div
                key={`prev-${i}`}
                className="min-h-[90px] sm:min-h-[110px] p-2 bg-[var(--surface-subtle)]/40 text-[var(--muted)] opacity-40 select-none"
              >
                <span className="text-xs font-medium">{dayNum}</span>
              </div>
            );
          })}

          {/* Current Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const monthStr = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
            const dateObj = new Date(currentYear, currentMonth, dayNum);
            const dayOfWeek = dateObj.getDay();

            const isToday =
              today.getFullYear() === currentYear &&
              today.getMonth() === currentMonth &&
              today.getDate() === dayNum;

            const shifts = getShiftsForDate(dateStr, dayOfWeek);
            const workingShifts = shifts.filter((s) => s.isAvailable);
            const leaveShifts = shifts.filter((s) => !s.isAvailable);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDayInfo({ date: dateStr, shifts })}
                className={`min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  isToday ? 'bg-teal-50/40 dark:bg-teal-950/20' : 'bg-[var(--surface)]'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isToday
                        ? 'bg-[var(--accent)] text-white font-bold shadow-xs'
                        : 'text-[var(--fg)]'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {shifts.length > 0 && (
                    <span className="text-[10px] font-mono text-[var(--muted)] font-medium">
                      {workingShifts.length} แพทย์
                    </span>
                  )}
                </div>

                {/* Shift Pills Preview */}
                <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                  {leaveShifts.slice(0, 1).map((s) => (
                    <div
                      key={`leave-${s.doctor.id}`}
                      className="px-1.5 py-0.5 rounded-md text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-medium truncate"
                    >
                      🏖️ {s.doctor.last_name || s.doctor.first_name} (ลา)
                    </div>
                  ))}

                  {workingShifts.slice(0, 2).map((s) => (
                    <div
                      key={`work-${s.doctor.id}`}
                      className="px-1.5 py-0.5 rounded-md text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 font-medium truncate flex items-center justify-between"
                    >
                      <span className="truncate">{s.doctor.first_name}</span>
                      <span className="font-mono text-[9px] opacity-80 shrink-0 ml-1">
                        {s.statusText}
                      </span>
                    </div>
                  ))}

                  {workingShifts.length > 2 && (
                    <span className="text-[10px] text-[var(--muted)] pl-1">
                      +{workingShifts.length - 2} ท่าน
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day Schedule Detail Drawer */}
      {selectedDayInfo && (
        <DayScheduleDrawer
          isOpen={!!selectedDayInfo}
          onClose={() => setSelectedDayInfo(null)}
          selectedDate={selectedDayInfo.date}
          dayShifts={selectedDayInfo.shifts}
          onAddOverride={() => {
            if (onAddOverrideForDate) {
              onAddOverrideForDate(selectedDayInfo.date);
            }
          }}
        />
      )}
    </div>
  );
}
