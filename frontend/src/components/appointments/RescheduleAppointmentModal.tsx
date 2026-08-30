'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useAvailableSlots, useRescheduleAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatDate, formatTime } from '@/lib/format';
import type { Appointment, TimeSlot } from '@/types';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export function RescheduleAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: RescheduleAppointmentModalProps) {
  const { addToast } = useToast();
  const rescheduleMutation = useRescheduleAppointment();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [newDate, setNewDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen && appointment) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNewDate(tomorrow.toISOString().split('T')[0]);
      setSelectedSlot(null);
      setNotes('');
    }
  }, [isOpen, appointment]);

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
              👤 <strong>คนไข้:</strong> {appointment.patient?.first_name} {appointment.patient?.last_name} ({appointment.patient?.hn})
            </p>
            <p>
              🩺 <strong>แพทย์:</strong> {appointment.doctor?.title || ''} {appointment.doctor?.first_name} {appointment.doctor?.last_name}
            </p>
            <p className="text-rose-600 dark:text-rose-400 font-medium">
              📅 วันเดิม: {formatDate(appointment.appointment_date)} เวลา {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)} น.
            </p>
          </div>
        </div>

        {/* New Date Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            เลือกวันนัดหมายใหม่ *
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
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
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
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
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
