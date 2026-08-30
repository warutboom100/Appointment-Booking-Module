import { useState } from 'react';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useDeleteSchedule } from '@/hooks/useSchedules';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatTime } from '@/lib/format';
import type { Doctor, DoctorSchedule } from '@/types';

export interface WeeklyTimetableGridProps {
  doctors: Doctor[];
  allSchedules: Record<string, DoctorSchedule[]>;
  isLoading?: boolean;
  onEditSchedule?: (schedule: DoctorSchedule) => void;
}

const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

interface ScheduleRowItem {
  id: string;
  doctor: Doctor;
  schedule: DoctorSchedule;
  dayName: string;
}

export function WeeklyTimetableGrid({
  doctors,
  allSchedules,
  isLoading = false,
  onEditSchedule,
}: WeeklyTimetableGridProps) {
  const { addToast } = useToast();
  const deleteScheduleMutation = useDeleteSchedule();
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleRowItem | null>(null);

  const rows: ScheduleRowItem[] = [];

  doctors.forEach((doc) => {
    const schedules = allSchedules[doc.id] || [];
    schedules.forEach((sch) => {
      rows.push({
        id: sch.id,
        doctor: doc,
        schedule: sch,
        dayName: DAY_NAMES[sch.day_of_week] || `วัน ${sch.day_of_week}`,
      });
    });
  });

  // Sort by day_of_week, then start_time
  rows.sort((a, b) => {
    if (a.schedule.day_of_week !== b.schedule.day_of_week) {
      return a.schedule.day_of_week - b.schedule.day_of_week;
    }
    return a.schedule.start_time.localeCompare(b.schedule.start_time);
  });

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    try {
      await deleteScheduleMutation.mutateAsync(scheduleToDelete.id);
      addToast({
        title: 'ลบสำเร็จ',
        description: 'ลบตารางออกตรวจประจำสัปดาห์แล้ว',
        type: 'success',
      });
      setScheduleToDelete(null);
    } catch (err) {
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: getErrorMessage(err),
        type: 'error',
      });
    }
  };

  const columns: Column<ScheduleRowItem>[] = [
    {
      key: 'day',
      header: 'วันตรวจ',
      render: (r) => (
        <Badge
          variant={
            r.schedule.day_of_week === 0
              ? 'rose'
              : r.schedule.day_of_week === 6
              ? 'blue'
              : 'teal'
          }
          size="md"
        >
          {r.dayName}
        </Badge>
      ),
    },
    {
      key: 'doctor',
      header: 'แพทย์ / แผนก',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--fg)]">
            {r.doctor.title || ''} {r.doctor.first_name} {r.doctor.last_name}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {r.doctor.department_name || 'แผนกผู้ป่วยนอก'} {r.doctor.room_number ? `• ห้องตรวจ ${r.doctor.room_number}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'hours',
      header: 'เวลาออกตรวจ',
      render: (r) => (
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--fg)]">
          <span>{formatTime(r.schedule.start_time)} - {formatTime(r.schedule.end_time)} น.</span>
        </div>
      ),
    },
    {
      key: 'break',
      header: 'เวลาพักเบรค',
      render: (r) => {
        if (!r.schedule.break_start || !r.schedule.break_end) {
          return <span className="text-xs text-[var(--muted)]">-</span>;
        }
        return (
          <span className="text-xs font-mono text-[var(--muted)]">
            {formatTime(r.schedule.break_start)} - {formatTime(r.schedule.break_end)} น.
          </span>
        );
      },
    },
    {
      key: 'max',
      header: 'รับนัดสูงสุด',
      render: (r) => (
        <span className="text-xs text-[var(--fg)] font-mono">
          {r.schedule.max_appointments ? `${r.schedule.max_appointments} คน` : 'ไม่จำกัด'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {onEditSchedule && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditSchedule(r.schedule)}
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
            >
              แก้ไข
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScheduleToDelete(r)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            ลบ
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        data={rows}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="ยังไม่มีตารางออกตรวจประจำสัปดาห์ของแพทย์"
      />

      <ConfirmDialog
        isOpen={!!scheduleToDelete}
        title="ยืนยันการลบตารางออกตรวจ"
        message={
          <span>
            คุณต้องการลบตารางออกตรวจของ{' '}
            <strong className="text-[var(--fg)]">
              {scheduleToDelete?.doctor.title || ''} {scheduleToDelete?.doctor.first_name} {scheduleToDelete?.doctor.last_name}
            </strong>{' '}
            (วัน{scheduleToDelete?.dayName} {formatTime(scheduleToDelete?.schedule.start_time)} - {formatTime(scheduleToDelete?.schedule.end_time)} น.) ใช่หรือไม่?
          </span>
        }
        subMessage="การลบตารางออกตรวจจะทำให้คิวตรวจประจำวันดังกล่าวของแพทย์ถูกยกเลิก"
        confirmLabel="ลบตารางออกตรวจ"
        isLoading={deleteScheduleMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setScheduleToDelete(null)}
      />
    </>
  );
}
