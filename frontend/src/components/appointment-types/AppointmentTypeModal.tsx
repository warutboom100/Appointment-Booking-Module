'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCreateAppointmentType, useUpdateAppointmentType } from '@/hooks/useAppointmentTypes';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import type { AppointmentType } from '@/types';

interface AppointmentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeToEdit?: AppointmentType | null;
  onSuccess?: () => void;
}

const PRESET_COLORS = [
  { hex: '#0D9488', label: 'Teal' },
  { hex: '#2563EB', label: 'Blue' },
  { hex: '#4F46E5', label: 'Indigo' },
  { hex: '#7C3AED', label: 'Purple' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#D97706', label: 'Amber' },
  { hex: '#E11D48', label: 'Rose' },
  { hex: '#475569', label: 'Slate' },
];

const PRESET_DURATIONS = [15, 20, 30, 45, 60, 90, 120];

export function AppointmentTypeModal({
  isOpen,
  onClose,
  typeToEdit,
  onSuccess,
}: AppointmentTypeModalProps) {
  const { addToast } = useToast();
  const createMutation = useCreateAppointmentType();
  const updateMutation = useUpdateAppointmentType();

  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [color, setColor] = useState('#0D9488');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeToEdit) {
      setName(typeToEdit.name || '');
      setDurationMinutes(typeToEdit.duration_minutes || 30);
      setColor(typeToEdit.color || typeToEdit.color_code || '#0D9488');
      setDescription(typeToEdit.description || '');
      setIsActive(typeToEdit.is_active ?? true);
    } else {
      setName('');
      setDurationMinutes(30);
      setColor('#0D9488');
      setDescription('');
      setIsActive(true);
    }
    setErrors({});
  }, [typeToEdit, isOpen]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'กรุณากรอกชื่อประเภทการตรวจ';
    if (!durationMinutes || durationMinutes <= 0) {
      e.durationMinutes = 'ระยะเวลาต้องมากกว่า 0 นาที';
    } else if (durationMinutes > 480) {
      e.durationMinutes = 'ระยะเวลาต้องไม่เกิน 480 นาที (8 ชม.)';
    }
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      e.color = 'รหัสสีต้องเป็น Hex Code 6 หลัก เช่น #0D9488';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (typeToEdit) {
        await updateMutation.mutateAsync({
          id: typeToEdit.id,
          input: {
            name: name.trim(),
            duration_minutes: Number(durationMinutes),
            color: color || null,
            description: description.trim() || null,
            is_active: isActive,
          },
        });
        addToast({
          type: 'success',
          title: 'บันทึกสำเร็จ',
          description: `แก้ไขข้อมูล "${name.trim()}" เรียบร้อยแล้ว`,
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          duration_minutes: Number(durationMinutes),
          color: color || null,
          description: description.trim() || null,
        });
        addToast({
          type: 'success',
          title: 'สร้างประเภทการตรวจสำเร็จ',
          description: `เพิ่มประเภท "${name.trim()}" (${durationMinutes} นาที) เรียบร้อยแล้ว`,
        });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        description: getErrorMessage(err),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={typeToEdit ? 'แก้ไขประเภทการนัดหมาย' : 'เพิ่มประเภทการนัดหมายใหม่'}
      subtitle="กำหนดชื่อ ระยะเวลาตรวจ และแท็กสีสำหรับคิวนัดหมาย"
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isPending}>
            {typeToEdit ? 'บันทึกการแก้ไข' : 'สร้างประเภทการตรวจ'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <Input
          label="ชื่อประเภทการตรวจ (Name) *"
          placeholder="เช่น ตรวจรักษาทั่วไป, ตรวจสุขภาพประจำปี, ฉีดวัคซีน"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: '' }));
          }}
          error={errors.name}
          autoFocus
        />

        {/* Duration (minutes) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight">
            ระยะเวลาตรวจ (นาที) *
          </label>
          <Input
            type="number"
            min={5}
            max={480}
            step={5}
            placeholder="30"
            value={durationMinutes || ''}
            onChange={(e) => {
              setDurationMinutes(Number(e.target.value));
              if (errors.durationMinutes) setErrors((p) => ({ ...p, durationMinutes: '' }));
            }}
            error={errors.durationMinutes}
          />
          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] text-[var(--muted)] mr-1">ลัด:</span>
            {PRESET_DURATIONS.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setDurationMinutes(dur)}
                className={`text-xs px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  durationMinutes === dur
                    ? 'bg-teal-600 text-white border-teal-600 font-semibold shadow-2xs'
                    : 'bg-[var(--surface-subtle)] text-[var(--fg-secondary)] border-[var(--border)] hover:bg-[var(--surface)]'
                }`}
              >
                {dur}m
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker & Live Badge Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight">
            รหัสสีประจำประเภทการตรวจ (Color Code)
          </label>

          {/* Palette Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                  color.toLowerCase() === c.hex.toLowerCase()
                    ? 'border-[var(--fg)] scale-110 shadow-xs'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              >
                {color.toLowerCase() === c.hex.toLowerCase() && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <Input
              placeholder="#0D9488"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="font-mono"
            />
            {/* Live Preview Pill */}
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 text-white shadow-xs"
              style={{ backgroundColor: color || '#0D9488' }}
            >
              🏷️ {name.trim() || 'ตัวอย่าง'} ({durationMinutes || 30} นาที)
            </div>
          </div>
        </div>

        {/* Description */}
        <Textarea
          label="คำอธิบายเพิ่มเติม (Description)"
          placeholder="ระบุข้อกำหนดหรือรายละเอียดเพิ่มเติมของประเภทการตรวจนี้..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          optional
        />

        {/* Status toggle (Edit Mode) */}
        {typeToEdit && (
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight">
              สถานะการใช้งาน
            </label>
            <SegmentedControl
              options={[
                { label: 'เปิดใช้งาน', value: 'true' },
                { label: 'ปิดใช้งาน', value: 'false' },
              ]}
              value={isActive ? 'true' : 'false'}
              onChange={(val) => setIsActive(val === 'true')}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
