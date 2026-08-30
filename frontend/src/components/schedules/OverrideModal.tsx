'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { TimeInput } from '@/components/ui/TimeInput';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCreateOverride, useUpdateOverride } from '@/hooks/useSchedules';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatTime } from '@/lib/format';
import type { Doctor, ScheduleOverride } from '@/types';

export interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  selectedDoctorId?: string;
  defaultDate?: string;
  overrideToEdit?: ScheduleOverride | null;
  onSuccess?: () => void;
}

export function OverrideModal({
  isOpen,
  onClose,
  doctors,
  selectedDoctorId,
  defaultDate,
  overrideToEdit,
  onSuccess,
}: OverrideModalProps) {
  const { addToast } = useToast();
  const createOverrideMutation = useCreateOverride();
  const updateOverrideMutation = useUpdateOverride();
  const isEditing = !!overrideToEdit;

  const [doctorId, setDoctorId] = useState('');
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideType, setOverrideType] = useState<'off' | 'extra'>('off');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [reason, setReason] = useState('ลาพักร้อน');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (overrideToEdit) {
      setDoctorId(overrideToEdit.doctor_id);
      setOverrideDate(overrideToEdit.override_date);
      setOverrideType(overrideToEdit.is_available ? 'extra' : 'off');
      setStartTime(formatTime(overrideToEdit.start_time) || '09:00');
      setEndTime(formatTime(overrideToEdit.end_time) || '16:00');
      setBreakStart(formatTime(overrideToEdit.break_start) || '12:00');
      setBreakEnd(formatTime(overrideToEdit.break_end) || '13:00');
      setReason(overrideToEdit.reason || (overrideToEdit.is_available ? 'ออกตรวจเพิ่มกรณีพิเศษ' : 'ลาพักร้อน'));
    } else if (defaultDate) {
      setOverrideDate(defaultDate);
      if (selectedDoctorId) {
        setDoctorId(selectedDoctorId);
      } else if (doctors.length > 0 && !doctorId) {
        setDoctorId(doctors[0].id);
      }
      setOverrideType('off');
      setReason('ลาพักร้อน');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setOverrideDate(today);
      if (selectedDoctorId) {
        setDoctorId(selectedDoctorId);
      } else if (doctors.length > 0 && !doctorId) {
        setDoctorId(doctors[0].id);
      }
    }
  }, [overrideToEdit, defaultDate, selectedDoctorId, doctors]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!doctorId) e.doctorId = 'กรุณาเลือกแพทย์';
    if (!overrideDate) e.overrideDate = 'กรุณาระบุวันที่';
    if (overrideType === 'extra') {
      if (!startTime) e.startTime = 'กรุณาระบุเวลาเริ่มงาน';
      if (!endTime) e.endTime = 'กรุณาระบุเวลาเลิกงาน';
      if (startTime && endTime && startTime >= endTime) {
        e.endTime = 'เวลาเลิกงานต้องมากกว่าเวลาเริ่มงาน';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isPending = createOverrideMutation.isPending || updateOverrideMutation.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const isAvailable = overrideType === 'extra';
    const payload = {
      override_date: overrideDate,
      is_available: isAvailable,
      start_time: isAvailable && startTime ? formatTime(startTime) : null,
      end_time: isAvailable && endTime ? formatTime(endTime) : null,
      break_start: isAvailable && breakStart ? formatTime(breakStart) : null,
      break_end: isAvailable && breakEnd ? formatTime(breakEnd) : null,
      reason: reason.trim() || undefined,
    };

    try {
      if (isEditing && overrideToEdit) {
        await updateOverrideMutation.mutateAsync({
          id: overrideToEdit.id,
          input: payload,
        });
        addToast({
          title: 'แก้ไขสำเร็จ',
          description: isAvailable
            ? 'อัปเดตเวรออกตรวจพิเศษเรียบร้อยแล้ว'
            : 'อัปเดตวันหยุดแพทย์เรียบร้อยแล้ว',
          type: 'success',
        });
      } else {
        await createOverrideMutation.mutateAsync({
          doctorId,
          input: payload,
        });
        addToast({
          title: 'บันทึกสำเร็จ',
          description: isAvailable
            ? 'บันทึกเวรออกตรวจพิเศษเรียบร้อยแล้ว'
            : 'บันทึกวันหยุดแพทย์ (Leave Override) เรียบร้อยแล้ว',
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
      title={isEditing ? 'แก้ไขวันหยุด / เวรพิเศษ (Edit Override)' : 'บันทึกวันหยุด / เวรพิเศษ (Schedule Override)'}
      subtitle={isEditing ? 'ปรับปรุงข้อมูลวันหยุดหรือเวรตรวจพิเศษเฉพาะวัน' : 'กำหนดวันหยุดหรือเพิ่มช่วงเวลาออกตรวจพิเศษเฉพาะวัน'}
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
            {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
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
            label: `${d.title || ''} ${d.first_name} ${d.last_name}`,
          }))}
        />

        {/* Override Date */}
        <Input
          type="date"
          label="วันที่ต้องการระบุ (Override Date) *"
          value={overrideDate}
          onChange={(e) => setOverrideDate(e.target.value)}
          error={errors.overrideDate}
        />

        {/* Override Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight">
            ประเภทรายการ (Override Type) *
          </label>
          <SegmentedControl<'off' | 'extra'>
            options={[
              { value: 'off', label: '🏖️ วันหยุดแพทย์ / ลา (Off Day)' },
              { value: 'extra', label: '⭐ เปิดเวรตรวจพิเศษ (Extra Shift)' },
            ]}
            value={overrideType}
            onChange={(val) => {
              setOverrideType(val);
              if (val === 'off' && !reason) setReason('ลาพักร้อน');
              if (val === 'extra' && reason === 'ลาพักร้อน') setReason('ออกตรวจเพิ่มกรณีพิเศษ');
            }}
            className="w-full"
          />
        </div>

        {/* Extra Shift Hours */}
        {overrideType === 'extra' && (
          <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-col gap-4 animate-pop">
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

            <div className="grid grid-cols-2 gap-4">
              <TimeInput
                label="เริ่มพัก"
                value={breakStart}
                onChange={setBreakStart}
                optional
              />
              <TimeInput
                label="สิ้นสุดพัก"
                value={breakEnd}
                onChange={setBreakEnd}
                optional
              />
            </div>
          </div>
        )}

        {/* Reason / Notes */}
        <Input
          label="เหตุผล / หมายเหตุ"
          placeholder={overrideType === 'off' ? 'เช่น ลาพักร้อน, ไปอบรมวิชาการ' : 'เช่น คลินิกนอกเวลาพิเศษ'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          optional
        />
      </form>
    </Modal>
  );
}
