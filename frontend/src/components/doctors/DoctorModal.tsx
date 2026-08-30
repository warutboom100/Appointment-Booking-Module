'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useDepartments } from '@/hooks/useDepartments';
import { useCreateDoctor, useUpdateDoctor } from '@/hooks/useDoctors';
import { useToast } from '@/providers/ToastProvider';
import { z } from 'zod';
import type { Doctor } from '@/types';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorToEdit?: Doctor | null;
  onSuccess?: () => void;
}

const doctorSchema = z.object({
  first_name: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  last_name: z.string().trim().min(1, 'กรุณาระบุนามสกุล').max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  department_id: z.string().uuid('กรุณาเลือกแผนก'),
  license_no: z.string().trim().min(1, 'กรุณาระบุเลขที่ใบประกอบวิชาชีพ').max(50, 'เลขที่ใบประกอบวิชาชีพต้องไม่เกิน 50 ตัวอักษร'),
  title: z.string().trim().optional().nullable(),
  specialization: z.string().trim().max(200, 'ความเชี่ยวชาญต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
  phone: z.string().trim().max(20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร').optional().nullable(),
  email: z.string().trim().email('รูปแบบอีเมลไม่ถูกต้อง').max(100, 'อีเมลต้องไม่เกิน 100 ตัวอักษร').optional().nullable().or(z.literal('')),
  is_active: z.boolean(),
});

export function DoctorModal({ isOpen, onClose, doctorToEdit, onSuccess }: DoctorModalProps) {
  const isEditing = !!doctorToEdit;
  const { addToast } = useToast();
  
  const { data: deptResponse, isLoading: isLoadingDepartments } = useDepartments({ limit: 100 });
  const departments = deptResponse?.data || [];
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (doctorToEdit) {
        setFirstName(doctorToEdit.first_name);
        setLastName(doctorToEdit.last_name);
        setTitle(doctorToEdit.title || '');
        setDepartmentId(doctorToEdit.department_id);
        setLicenseNo(doctorToEdit.license_no || ''); // Assume license_no is mapped or added to types if missing, but wait, is license_no in types?
        setSpecialization(doctorToEdit.specialization || '');
        setPhone(doctorToEdit.phone || '');
        setEmail(doctorToEdit.email || '');
        setIsActive(doctorToEdit.is_active);
      } else {
        setFirstName('');
        setLastName('');
        setTitle('');
        setDepartmentId('');
        setLicenseNo('');
        setSpecialization('');
        setPhone('');
        setEmail('');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, doctorToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      first_name: firstName,
      last_name: lastName,
      title: title || null,
      department_id: departmentId,
      license_no: licenseNo,
      specialization: specialization || null,
      phone: phone || null,
      email: email || null,
      is_active: isActive,
    };

    const result = doctorSchema.safeParse(formData);
    
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
        await updateDoctor.mutateAsync({
          id: doctorToEdit.id,
          input: result.data,
        });
        addToast({ type: 'success', title: 'อัปเดตข้อมูลแพทย์สำเร็จ' });
      } else {
        await createDoctor.mutateAsync(result.data);
        addToast({ type: 'success', title: 'เพิ่มแพทย์ใหม่สำเร็จ' });
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: isEditing ? 'ไม่สามารถอัปเดตข้อมูลได้' : 'ไม่สามารถเพิ่มแพทย์ได้',
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const isPending = createDoctor.isPending || updateDoctor.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'แก้ไขข้อมูลแพทย์' : 'เพิ่มแพทย์ใหม่'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="คำนำหน้าชื่อ"
            placeholder="นพ., พญ., ดร."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            optional
          />
          <div className="col-span-1" />
          
          <Input
            label="ชื่อ *"
            placeholder="ชื่อจริง"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.first_name}
          />
          
          <Input
            label="นามสกุล *"
            placeholder="นามสกุล"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.last_name}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="แผนก *"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            error={errors.department_id}
            options={[
              { value: '', label: 'เลือกแผนก' },
              ...departments.map((d) => ({
                value: d.id,
                label: d.name,
              })),
            ]}
            disabled={isLoadingDepartments}
          />

          <Input
            label="เลขที่ใบประกอบวิชาชีพ *"
            placeholder="เลขใบประกอบวิชาชีพเวชกรรม"
            value={licenseNo}
            onChange={(e) => setLicenseNo(e.target.value)}
            error={errors.license_no}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ความเชี่ยวชาญ"
            placeholder="เช่น ศัลยกรรมกระดูกและข้อ"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            error={errors.specialization}
            optional
          />
          
          <Input
            label="เบอร์โทรศัพท์"
            placeholder="เบอร์โทรศัพท์ติดต่อ"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            optional
          />
          
          <Input
            label="อีเมล"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            optional
          />
        </div>

        {isEditing && (
          <div>
            <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight mb-2 block">
              สถานะ
            </label>
            <SegmentedControl
              options={[
                { label: 'ปฏิบัติงาน', value: 'active' },
                { label: 'พักงาน/ลาออก', value: 'inactive' },
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
