'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useCancelAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatDate, formatTime } from '@/lib/format';
import type { Appointment } from '@/types';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

const QUICK_REASONS = [
  'คนไข้ติดธุระด่วน',
  'คนไข้ขอยกเลิกนัด (ไม่มีกำหนด)',
  'อาการดีขึ้นแล้ว ไม่ประสงค์ตรวจเพิ่ม',
  'นัดหมายซ้ำซ้อน',
  'แพทย์ติดภารกิจด่วน / ลาฉุกเฉิน',
];

export function CancelAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState('');
  const { addToast } = useToast();
  const cancelMutation = useCancelAppointment();

  if (!appointment) return null;

  const handleCancel = async () => {
    if (!reason.trim()) {
      addToast({
        title: 'กรุณาระบุเหตุผล',
        description: 'ต้องระบุเหตุผลการยกเลิกนัดหมายก่อนดำเนินการ',
        type: 'error',
      });
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: appointment.id,
        reason: reason.trim(),
      });

      addToast({
        title: 'ยกเลิกการนัดหมายสำเร็จ',
        description: 'ช่วงเวลานี้ได้รับการคืนกลับเข้าสู่ตารางเวลาว่างแล้ว',
        type: 'success',
      });

      setReason('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      addToast({
        title: 'ไม่สามารถยกเลิกนัดหมายได้',
        description: getErrorMessage(error),
        type: 'error',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ยืนยันการยกเลิกนัดหมาย"
      subtitle="ระบบจะปล่อยช่วงเวลานัดนี้คืนกลับเป็นช่วงเวลาว่าง (Slot Available)"
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        {/* Appointment Mini Summary */}
        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              รายละเอียดนัดหมายที่จะยกเลิก
            </span>
            <Badge variant="rose" size="sm">
              ยกเลิกนัด
            </Badge>
          </div>

          <div className="text-xs text-[var(--fg)] flex flex-col gap-1 mt-1">
            <p>
              👤 <strong>คนไข้:</strong> {appointment.patient_name || `${appointment.patient?.first_name || ''} ${appointment.patient?.last_name || ''}`.trim() || 'ผู้ป่วย'} ({appointment.patient_hn || appointment.patient?.hn || '-'})
            </p>
            <p>
              🩺 <strong>แพทย์:</strong> {appointment.doctor_name || `${appointment.doctor?.title || ''} ${appointment.doctor?.first_name || ''} ${appointment.doctor?.last_name || ''}`.trim() || 'แพทย์ประจำแผนก'}
            </p>
            <p>
              📅 <strong>วัน-เวลา:</strong> {formatDate(appointment.appointment_date)} เวลา {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)} น.
            </p>
          </div>
        </div>

        {/* Quick Reason Chips */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            เลือกเหตุผลด่วน
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  reason === r
                    ? 'bg-rose-600 text-white border-rose-600 font-medium'
                    : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Textarea */}
        <Textarea
          label="ระบุเหตุผลการยกเลิกนัดหมาย *"
          placeholder="พิมพ์เหตุผลที่ต้องยกเลิกนัดหมาย..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            ย้อนกลับ
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={!reason.trim() || cancelMutation.isPending}
            onClick={handleCancel}
          >
            {cancelMutation.isPending ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิกนัดหมาย'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
