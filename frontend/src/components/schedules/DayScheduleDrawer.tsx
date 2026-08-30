import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useDeleteOverride } from '@/hooks/useSchedules';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatDate, formatTime } from '@/lib/format';
import type { Doctor, DoctorSchedule, ScheduleOverride } from '@/types';

export interface DayShiftInfo {
  doctor: Doctor;
  schedule?: DoctorSchedule;
  override?: ScheduleOverride;
  isAvailable: boolean;
  statusText: string;
}

export interface DayScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  dayShifts: DayShiftInfo[];
  onAddOverride?: () => void;
  onEditOverride?: (override: ScheduleOverride) => void;
  onSuccess?: () => void;
}

export function DayScheduleDrawer({
  isOpen,
  onClose,
  selectedDate,
  dayShifts,
  onAddOverride,
  onEditOverride,
  onSuccess,
}: DayScheduleDrawerProps) {
  const { addToast } = useToast();
  const deleteOverrideMutation = useDeleteOverride();
  const [overrideToDelete, setOverrideToDelete] = useState<{ id: string; doctorName: string } | null>(null);

  const handleConfirmDeleteOverride = async () => {
    if (!overrideToDelete) return;
    try {
      await deleteOverrideMutation.mutateAsync(overrideToDelete.id);
      addToast({
        title: 'ลบสำเร็จ',
        description: 'ลบรายการวันหยุด / เวรพิเศษเรียบร้อยแล้ว',
        type: 'success',
      });
      setOverrideToDelete(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: getErrorMessage(err),
        type: 'error',
      });
    }
  };

  const availableCount = dayShifts.filter((s) => s.isAvailable).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>ตารางออกตรวจวันที่</span>
          <span className="text-[var(--accent)] font-semibold">{formatDate(selectedDate)}</span>
        </div>
      }
      subtitle={`แพทย์ออกตรวจทั้งหมด ${availableCount} จาก ${dayShifts.length} ท่าน`}
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {onAddOverride && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onAddOverride();
              }}
            >
              + บันทึกวันหยุด / เวรพิเศษในวันนี้
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            ปิดหน้าต่าง
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {dayShifts.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--muted)]">
            ไม่มีแพทย์ที่มีตารางออกตรวจในวันนี้
          </div>
        ) : (
          dayShifts.map((shift) => {
            const doc = shift.doctor;
            return (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border transition-all ${
                  shift.isAvailable
                    ? 'bg-[var(--surface)] border-[var(--border)] shadow-xs'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Doctor avatar & info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                      {doc.first_name.slice(0, 1)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--fg)]">
                        {doc.title || ''} {doc.first_name} {doc.last_name}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {doc.department_name || 'แผนกผู้ป่วยนอก'} {doc.room_number ? `• ห้องตรวจ ${doc.room_number}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {shift.override ? (
                      shift.override.is_available ? (
                        <Badge variant="amber" size="sm" dot>
                          เวรพิเศษ
                        </Badge>
                      ) : (
                        <Badge variant="rose" size="sm" dot>
                          ลา / วันหยุด
                        </Badge>
                      )
                    ) : shift.isAvailable ? (
                      <Badge variant="teal" size="sm" dot>
                        ออกตรวจปกติ
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        ไม่มีเวรตรวจ
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Hours & Details */}
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--fg)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted)]">⏰ เวลาตรวจ:</span>
                    <span className="font-semibold font-mono">
                      {shift.override && shift.override.is_available
                        ? `${formatTime(shift.override.start_time)} - ${formatTime(shift.override.end_time)} น.`
                        : shift.schedule
                        ? `${formatTime(shift.schedule.start_time)} - ${formatTime(shift.schedule.end_time)} น.`
                        : '-'}
                    </span>
                  </div>

                  {/* Break info */}
                  {((shift.override && shift.override.break_start) ||
                    (shift.schedule && shift.schedule.break_start)) && (
                    <div className="text-[var(--muted)] text-[11px]">
                      พักเบรค:{' '}
                      <span className="font-mono text-[var(--fg)]">
                        {formatTime(shift.override?.break_start || shift.schedule?.break_start)} -{' '}
                        {formatTime(shift.override?.break_end || shift.schedule?.break_end)} น.
                      </span>
                    </div>
                  )}

                  {/* Override reason */}
                  {shift.override?.reason && (
                    <div className="w-full text-xs text-rose-700 dark:text-rose-300 font-medium">
                      หมายเหตุ: {shift.override.reason}
                    </div>
                  )}

                  {/* Override Actions */}
                  {shift.override && (
                    <div className="w-full pt-2 mt-1 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                      {onEditOverride && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onClose();
                            if (shift.override && onEditOverride) onEditOverride(shift.override);
                          }}
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs py-1"
                        >
                          แก้ไขรายการ
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (shift.override) {
                            setOverrideToDelete({
                              id: shift.override.id,
                              doctorName: `${doc.title || ''} ${doc.first_name} ${doc.last_name}`,
                            });
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs py-1"
                      >
                        ลบวันหยุด/เวรพิเศษ
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!overrideToDelete}
        title="ยืนยันการลบวันหยุด / เวรพิเศษ"
        message={
          <span>
            คุณต้องการลบรายการวันหยุด / เวรพิเศษของ{' '}
            <strong className="text-[var(--fg)]">{overrideToDelete?.doctorName}</strong> ประจำวันที่{' '}
            <strong className="text-[var(--fg)]">{formatDate(selectedDate)}</strong> ใช่หรือไม่?
          </span>
        }
        subMessage="เมื่อลบแล้ว แพทย์จะกลับมามีสถานะออกตรวจตามตารางเวรปกติของวันดังกล่าว"
        confirmLabel="ลบรายการ"
        isLoading={deleteOverrideMutation.isPending}
        onConfirm={handleConfirmDeleteOverride}
        onCancel={() => setOverrideToDelete(null)}
      />
    </Modal>
  );
}
