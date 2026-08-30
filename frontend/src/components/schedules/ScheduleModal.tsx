'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { TimeInput } from '@/components/ui/TimeInput';
import { Button } from '@/components/ui/Button';
import { useCreateSchedule, useUpdateSchedule } from '@/hooks/useSchedules';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatTime } from '@/lib/format';
import type { Doctor, DoctorSchedule } from '@/types';

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  selectedDoctorId?: string;
  scheduleToEdit?: DoctorSchedule | null;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'วันอาทิตย์' },
  { value: 1, label: 'วันจันทร์' },
  { value: 2, label: 'วันอังคาร' },
  { value: 3, label: 'วันพุธ' },
  { value: 4, label: 'วันพฤหัสบดี' },
  { value: 5, label: 'วันศุกร์' },
  { value: 6, label: 'วันเสาร์' },
];

export function ScheduleModal({
  isOpen,
  onClose,
  doctors,
  selectedDoctorId,
  scheduleToEdit,
  onSuccess,
}: ScheduleModalProps) {
  const { addToast } = useToast();
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const isEditing = !!scheduleToEdit;

  const [doctorId, setDoctorId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [hasBreak, setHasBreak] = useState(true);
  const [maxAppointments, setMaxAppointments] = useState<string>('20');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (scheduleToEdit) {
      setDoctorId(scheduleToEdit.doctor_id);
      setDayOfWeek(scheduleToEdit.day_of_week);
      setStartTime(formatTime(scheduleToEdit.start_time) || '09:00');
      setEndTime(formatTime(scheduleToEdit.end_time) || '16:00');
      if (scheduleToEdit.break_start && scheduleToEdit.break_end) {
        setHasBreak(true);
        setBreakStart(formatTime(scheduleToEdit.break_start) || '12:00');
        setBreakEnd(formatTime(scheduleToEdit.break_end) || '13:00');
      } else {
        setHasBreak(false);
      }
      setMaxAppointments(scheduleToEdit.max_appointments ? String(scheduleToEdit.max_appointments) : '');
    } else if (selectedDoctorId) {
      setDoctorId(selectedDoctorId);
      setDayOfWeek(1);
      setStartTime('09:00');
      setEndTime('16:00');
      setBreakStart('12:00');
      setBreakEnd('13:00');
      setHasBreak(true);
      setMaxAppointments('20');
    } else if (doctors.length > 0 && !doctorId) {
      setDoctorId(doctors[0].id);
    }
  }, [scheduleToEdit, selectedDoctorId, doctors]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!doctorId) e.doctorId = 'กรุณาเลือกแพทย์';
    if (!startTime) e.startTime = 'กรุณาระบุเวลาเริ่มงาน';
    if (!endTime) e.endTime = 'กรุณาระบุเวลาเลิกงาน';
    if (startTime && endTime && startTime >= endTime) {
      e.endTime = 'เวลาเลิกงานต้องมากกว่าเวลาเริ่มงาน';
    }
    if (hasBreak) {
      if (!breakStart) e.breakStart = 'กรุณาระบุเวลาเริ่มพัก';
      if (!breakEnd) e.breakEnd = 'กรุณาระบุเวลาสิ้นสุดพัก';
      if (breakStart && breakEnd && breakStart >= breakEnd) {
        e.breakEnd = 'เวลาสิ้นสุดพักต้องมากกว่าเวลาเริ่มพัก';
      }
      if (breakStart < startTime || breakEnd > endTime) {
        e.breakStart = 'เวลาพักต้องอยู่ภายในช่วงเวลาทำงาน';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isPending = createScheduleMutation.isPending || updateScheduleMutation.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      day_of_week: dayOfWeek,
      start_time: formatTime(startTime),
      end_time: formatTime(endTime),
      break_start: hasBreak && breakStart ? formatTime(breakStart) : null,
      break_end: hasBreak && breakEnd ? formatTime(breakEnd) : null,
      max_appointments: maxAppointments ? parseInt(maxAppointments, 10) : null,
    };

    try {
      if (isEditing && scheduleToEdit) {
        await updateScheduleMutation.mutateAsync({
          id: scheduleToEdit.id,
          input: payload,
        });
        addToast({
          title: 'แก้ไขสำเร็จ',
          description: 'อัปเดตตารางออกตรวจประจำสัปดาห์เรียบร้อยแล้ว',
          type: 'success',
        });
      } else {
        await createScheduleMutation.mutateAsync({
          doctorId,
          input: payload,
        });
        addToast({
          title: 'บันทึกสำเร็จ',
          description: 'สร้างตารางออกตรวจประจำสัปดาห์เรียบร้อยแล้ว',
          type: 'success',
        });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: getErrorMessage(err),
        type: 'error',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'แก้ไขตารางเวรประจำสัปดาห์ (Edit Schedule)' : 'เพิ่มตารางเวรประจำสัปดาห์ (Weekly Schedule)'}
      subtitle={isEditing ? 'ปรับปรุงวันและช่วงเวลาออกตรวจประจำของแพทย์' : 'กำหนดวันและช่วงเวลาออกตรวจประจำของแพทย์'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isPending}
          >
            {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกตารางเวร'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Doctor select */}
        <Select
          label="แพทย์ผู้ตรวจ (Doctor) *"
          value={doctorId}
          disabled={isEditing}
          onChange={(e) => {
            setDoctorId(e.target.value);
            if (errors.doctorId) setErrors((p) => ({ ...p, doctorId: '' }));
          }}
          error={errors.doctorId}
          options={doctors.map((d) => ({
            value: d.id,
            label: `${d.title || ''} ${d.first_name} ${d.last_name} (${d.department_name || 'แผนกผู้ป่วยนอก'})`,
          }))}
        />

        {/* Day of Week */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight">
            วันในสัปดาห์ (Day of Week) *
          </label>
          <Select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            options={DAYS_OF_WEEK}
          />
        </div>

        {/* Working Hours */}
        <div className="grid grid-cols-2 gap-4">
          <TimeInput
            label="เวลาเริ่มออกตรวจ *"
            value={startTime}
            onChange={setStartTime}
            error={errors.startTime}
          />
          <TimeInput
            label="เวลาสิ้นสุดตรวจ *"
            value={endTime}
            onChange={setEndTime}
            error={errors.endTime}
          />
        </div>

        {/* Break Time Toggle */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--fg)]">กำหนดเวลาพักเบรค (Break Time)</span>
            <input
              type="checkbox"
              id="hasBreak"
              checked={hasBreak}
              onChange={(e) => setHasBreak(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
            />
          </div>

          {hasBreak && (
            <div className="grid grid-cols-2 gap-4 animate-pop">
              <TimeInput
                label="เริ่มพัก"
                value={breakStart}
                onChange={setBreakStart}
                error={errors.breakStart}
              />
              <TimeInput
                label="สิ้นสุดพัก"
                value={breakEnd}
                onChange={setBreakEnd}
                error={errors.breakEnd}
              />
            </div>
          )}
        </div>

        {/* Max Appointments */}
        <Input
          type="number"
          label="จำนวนรับนัดสูงสุดต่อวัน (Max Patients)"
          placeholder="เช่น 20 คน"
          value={maxAppointments}
          onChange={(e) => setMaxAppointments(e.target.value)}
          min={1}
          max={100}
          optional
        />
      </form>
    </Modal>
  );
}
