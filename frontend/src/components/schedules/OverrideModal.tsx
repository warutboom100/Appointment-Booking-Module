'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCreateOverride } from '@/hooks/useSchedules';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import type { Doctor } from '@/types';

export interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  selectedDoctorId?: string;
  defaultDate?: string;
  onSuccess?: () => void;
}

export function OverrideModal({
  isOpen,
  onClose,
  doctors,
  selectedDoctorId,
  defaultDate,
  onSuccess,
}: OverrideModalProps) {
  const { addToast } = useToast();
  const createOverrideMutation = useCreateOverride();

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
    if (selectedDoctorId) {
      setDoctorId(selectedDoctorId);
    } else if (doctors.length > 0 && !doctorId) {
      setDoctorId(doctors[0].id);
    }
  }, [selectedDoctorId, doctors, doctorId]);

  useEffect(() => {
    if (defaultDate) {
      setOverrideDate(defaultDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setOverrideDate(today);
    }
  }, [defaultDate]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const isAvailable = overrideType === 'extra';

    try {
      await createOverrideMutation.mutateAsync({
        doctorId,
        input: {
          override_date: overrideDate,
          is_available: isAvailable,
          start_time: isAvailable ? startTime : null,
          end_time: isAvailable ? endTime : null,
          break_start: isAvailable && breakStart ? breakStart : null,
          break_end: isAvailable && breakEnd ? breakEnd : null,
          reason: reason.trim() || undefined,
        },
      });

      addToast({
        title: 'บันทึกสำเร็จ',
        description: isAvailable
          ? 'บันทึกเวรออกตรวจพิเศษเรียบร้อยแล้ว'
          : 'บันทึกวันหยุดแพทย์ (Leave Override) เรียบร้อยแล้ว',
        type: 'success',
      });
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
      title="บันทึกวันหยุด / เวรพิเศษ (Schedule Override)"
      subtitle="กำหนดวันหยุดหรือเพิ่มช่วงเวลาออกตรวจพิเศษเฉพาะวัน"
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={createOverrideMutation.isPending}>
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createOverrideMutation.isPending}
          >
            บันทึกข้อมูล
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Doctor select */}
        <Select
          label="แพทย์ผู้ตรวจ (Doctor) *"
          value={doctorId}
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
              <Input
                type="time"
                label="เวลาเริ่มออกตรวจ *"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                error={errors.startTime}
              />
              <Input
                type="time"
                label="เวลาสิ้นสุดตรวจ *"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                error={errors.endTime}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                label="เริ่มพัก"
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
                optional
              />
              <Input
                type="time"
                label="สิ้นสุดพัก"
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
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
