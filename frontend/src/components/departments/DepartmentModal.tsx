'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCreateDepartment, useUpdateDepartment } from '@/hooks/useDepartments';
import { useToast } from '@/providers/ToastProvider';
import { z } from 'zod';
import type { Department } from '@/types';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentToEdit?: Department | null;
  onSuccess?: () => void;
}

const departmentSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อแผนก').max(100, 'ชื่อแผนกต้องไม่เกิน 100 ตัวอักษร'),
  description: z.string().trim().max(1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  location: z.string().trim().max(200, 'สถานที่ต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
  is_active: z.boolean(),
});

export function DepartmentModal({ isOpen, onClose, departmentToEdit, onSuccess }: DepartmentModalProps) {
  const isEditing = !!departmentToEdit;
  const { addToast } = useToast();
  
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (departmentToEdit) {
        setName(departmentToEdit.name);
        setDescription(departmentToEdit.description || '');
        setLocation(departmentToEdit.location || '');
        setIsActive(departmentToEdit.is_active);
      } else {
        setName('');
        setDescription('');
        setLocation('');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, departmentToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      name,
      description: description || null,
      location: location || null,
      is_active: isActive,
    };

    const result = departmentSchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        formattedErrors[path] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    try {
      if (isEditing) {
        await updateDepartment.mutateAsync({
          id: departmentToEdit.id,
          input: result.data,
        });
        addToast({ type: 'success', title: 'อัปเดตแผนกสำเร็จ' });
      } else {
        await createDepartment.mutateAsync(result.data);
        addToast({ type: 'success', title: 'เพิ่มแผนกใหม่สำเร็จ' });
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: isEditing ? 'ไม่สามารถอัปเดตแผนกได้' : 'ไม่สามารถเพิ่มแผนกได้',
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const isPending = createDepartment.isPending || updateDepartment.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มแผนกใหม่'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          label="ชื่อแผนก *"
          placeholder="เช่น แผนกศัลยกรรม, แผนกอายุรกรรม"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <Input
          label="สถานที่/อาคาร"
          placeholder="เช่น ชั้น 2 อาคาร A"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          error={errors.location}
          optional
        />

        <Textarea
          label="รายละเอียดเพิ่มเติม"
          placeholder="ข้อมูลเกี่ยวกับแผนกนี้"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          rows={3}
          optional
        />

        {isEditing && (
          <div>
            <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight mb-2 block">
              สถานะ
            </label>
            <SegmentedControl
              options={[
                { label: 'เปิดใช้งาน', value: 'active' },
                { label: 'ปิดใช้งาน', value: 'inactive' },
              ]}
              value={isActive ? 'active' : 'inactive'}
              onChange={(val) => setIsActive(val === 'active')}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
