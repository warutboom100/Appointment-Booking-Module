'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAvailableSlots, useRescheduleAppointment } from '@/hooks/useAppointments';
import { useDoctorSchedules, useDoctorOverrides } from '@/hooks/useSchedules';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatDate, formatTime } from '@/lib/format';
import type { Appointment, TimeSlot, DoctorSchedule, ScheduleOverride } from '@/types';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
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
}

function formatYmd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function RescheduleAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: RescheduleAppointmentModalProps) {
  const { addToast } = useToast();
  const rescheduleMutation = useRescheduleAppointment();

  const todayStr = useMemo(() => formatYmd(new Date()), []);

  const [newDate, setNewDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState<string>('');

  // 1. Fetch Doctor's Recurring Schedules and Overrides
  const doctorId = appointment?.doctor_id || '';
  const { data: schedules = [], isLoading: isSchedulesLoading } = useDoctorSchedules(doctorId);
  const { data: overrides = [], isLoading: isOverridesLoading } = useDoctorOverrides(doctorId);

  // 2. Compute Next 21 Days where Doctor is Available
  const availableDateOptions = useMemo(() => {
    if (!doctorId) return [];
    const options: AvailableDateOption[] = [];
    const today = new Date();

    for (let i = 0; i < 28; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = formatYmd(d);
      const dayOfWeek = d.getDay();

      const override = overrides.find(
        (o: ScheduleOverride) => o.override_date.slice(0, 10) === dateStr,
      );
      const recurring = schedules.find(
        (s: DoctorSchedule) => s.day_of_week === dayOfWeek && s.is_available,
      );

      let isAvailable = false;
      let isOverrideSpecial = false;
      let workingHours = '';

      if (override) {
        if (override.is_available) {
          isAvailable = true;
          isOverrideSpecial = true;
          workingHours = `${override.start_time?.slice(0, 5) || ''} - ${override.end_time?.slice(0, 5) || ''} น.`;
        } else {
          isAvailable = false;
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
        });
      }
    }

    return options;
  }, [doctorId, schedules, overrides]);

  // Reset or initialize state on modal open
  useEffect(() => {
    if (isOpen && appointment) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNewDate(formatYmd(tomorrow));
      setSelectedSlot(null);
      setNotes('');
    }
  }, [isOpen, appointment]);

  // Auto-select nearest available date when available dates load
  useEffect(() => {
    if (isOpen && !isSchedulesLoading && !isOverridesLoading && availableDateOptions.length > 0) {
      const isCurrentDateAvailable = availableDateOptions.some((opt) => opt.dateStr === newDate);
      if (!isCurrentDateAvailable) {
        setNewDate(availableDateOptions[0].dateStr);
      }
    }
  }, [isOpen, isSchedulesLoading, isOverridesLoading, availableDateOptions, newDate]);

  const { data: slotData, isLoading: isSlotsLoading } = useAvailableSlots({
    doctor_id: appointment?.doctor_id || '',
    date: newDate,
    appointment_type_id: appointment?.appointment_type_id || '',
  });

  const slots = slotData?.slots || [];

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

  if (!appointment) return null;

  const handleReschedule = async () => {
    if (!newDate || !selectedSlot) {
      addToast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณาเลือกวันที่และช่วงเวลาใหม่ที่ต้องการเลื่อนนัด',
        type: 'error',
      });
      return;
    }

    try {
      await rescheduleMutation.mutateAsync({
        id: appointment.id,
        input: {
          appointment_date: newDate,
          start_time: selectedSlot.start_time,
          reason_for_visit: appointment.reason_for_visit,
          notes: notes.trim() || undefined,
        },
      });

      addToast({
        title: 'เลื่อนการนัดหมายสำเร็จ',
        description: `ย้ายนัดหมายไปยังวันที่ ${formatDate(newDate)} เวลา ${formatTime(selectedSlot.start_time)} น. เรียบร้อยแล้ว`,
        type: 'success',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      addToast({
        title: 'ไม่สามารถเลื่อนนัดหมายได้',
        description: getErrorMessage(error),
        type: 'error',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="เลื่อนเวลานัดหมาย (Reschedule Appointment)"
      subtitle="ระบบจะยกเลิกช่วงเวลาเดิมและจองช่วงเวลาใหม่ให้คนไข้อัตโนมัติ"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5">
        {/* Old Appointment Summary */}
        <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            นัดหมายเดิม
          </span>
          <div className="text-xs text-[var(--fg)] flex flex-col gap-1">
            <p>
              👤 <strong>คนไข้:</strong> {appointment.patient_name || `${appointment.patient?.first_name || ''} ${appointment.patient?.last_name || ''}`.trim() || 'ผู้ป่วย'} ({appointment.patient_hn || appointment.patient?.hn || '-'})
            </p>
            <p>
              🩺 <strong>แพทย์:</strong> {appointment.doctor_name || `${appointment.doctor?.title || ''} ${appointment.doctor?.first_name || ''} ${appointment.doctor?.last_name || ''}`.trim() || 'แพทย์ประจำแผนก'}
            </p>
            <p className="text-rose-600 dark:text-rose-400 font-medium">
              📅 วันเดิม: {formatDate(appointment.appointment_date)} เวลา {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)} น.
            </p>
          </div>
        </div>

        {/* Available Dates Quick Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
              <span>✨</span>
              <span>เลือกจากวันที่แพทย์ลงตรวจจริง</span>
            </label>
            <span className="text-[11px] text-[var(--muted)]">คลิกเลือกวันได้ทันที</span>
          </div>

          {isSchedulesLoading || isOverridesLoading ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
              <span>กำลังตรวจสอบตารางตรวจแพทย์...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-[140px] overflow-y-auto pr-1">
              {availableDateOptions.slice(0, 12).map((opt) => {
                const isSelected = newDate === opt.dateStr;

                return (
                  <button
                    type="button"
                    key={opt.dateStr}
                    onClick={() => {
                      setNewDate(opt.dateStr);
                      setSelectedSlot(null);
                    }}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-[0.96] ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-500/30'
                        : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-[var(--muted)]'}`}>
                      {opt.dayNameShort}
                    </span>
                    <span className="text-xs font-bold font-mono">
                      {opt.dayNumber} {opt.monthShort}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual Date Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            หรือระบุวันที่เจาะจง *
          </label>
          <Input
            type="date"
            min={todayStr}
            value={newDate}
            onChange={(e) => {
              setNewDate(e.target.value);
              setSelectedSlot(null);
            }}
          />
        </div>

        {/* New Slots Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              เลือกช่วงเวลาใหม่ *
            </label>
            {slots.length > 0 && (
              <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                ว่าง {slots.length} ช่วง
              </span>
            )}
          </div>

          {isSlotsLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
              <span>กำลังตรวจสอบตารางตรวจแพทย์...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="py-6 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">
              ไม่มีช่วงเวลาว่างในวันที่เลือก กรุณาเลือกวันอื่น
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
              {morningSlots.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-[var(--muted)]">☀️ ช่วงเช้า</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {morningSlots.map((slot) => {
                      const isSelected =
                        selectedSlot?.start_time === slot.start_time &&
                        selectedSlot?.end_time === slot.end_time;
                      return (
                        <button
                          key={slot.start_time}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-500/30'
                              : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                          }`}
                        >
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)} น.
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {afternoonSlots.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-[var(--muted)]">🌤️ ช่วงบ่าย</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {afternoonSlots.map((slot) => {
                      const isSelected =
                        selectedSlot?.start_time === slot.start_time &&
                        selectedSlot?.end_time === slot.end_time;
                      return (
                        <button
                          key={slot.start_time}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-500/30'
                              : 'bg-[var(--surface)] text-[var(--fg)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
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

        {/* Optional Notes */}
        <Textarea
          label="เหตุผลการเลื่อนนัดหมาย (Optional)"
          placeholder="ระบุเหตุผลการเลื่อนนัด เช่น คนไข้ขอเลื่อนวันตรวจ..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          optional
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!newDate || !selectedSlot || rescheduleMutation.isPending}
            onClick={handleReschedule}
          >
            {rescheduleMutation.isPending ? 'กำลังดำเนินการ...' : '✓ ยืนยันเลื่อนนัดหมาย'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
