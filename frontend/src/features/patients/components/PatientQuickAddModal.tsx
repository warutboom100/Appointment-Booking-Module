'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCreatePatient } from '../patient.hooks';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/lib/api';
import type { Patient, Gender, CreatePatientInput } from '@/types';

export interface PatientQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: Patient) => void;
}

export function PatientQuickAddModal({
  isOpen,
  onClose,
  onSuccess,
}: PatientQuickAddModalProps) {
  const { addToast } = useToast();
  const createPatientMutation = useCreatePatient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [address, setAddress] = useState('');
  const [allergies, setAllergies] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDob('');
    setGender('male');
    setPhone('');
    setEmail('');
    setIdCardNumber('');
    setAddress('');
    setAllergies('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'กรุณาระบุชื่อจริง';
    if (!lastName.trim()) e.lastName = 'กรุณาระบุนามสกุล';
    if (!dob) e.dob = 'กรุณาระบุวันเดือนปีเกิด';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreatePatientInput = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dob,
      gender,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      id_card_number: idCardNumber.trim() || undefined,
      address: address.trim() || undefined,
      allergies: allergies.trim() || undefined,
    };

    try {
      const created = await createPatientMutation.mutateAsync(payload);
      addToast({
        title: 'ลงทะเบียนสำเร็จ',
        description: `สร้างเวชระเบียนผู้ป่วยสำเร็จ (HN: ${created.hn})`,
        type: 'success',
      });
      handleClose();
      if (onSuccess) onSuccess(created);
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
      onClose={handleClose}
      title="ลงทะเบียนผู้ป่วยใหม่ (Quick Add)"
      subtitle="กรอกข้อมูลเพื่อสร้างเวชระเบียนและสร้างเลขประจำตัวผู้ป่วย (HN) อัตโนมัติ"
      maxWidth="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createPatientMutation.isPending}>
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createPatientMutation.isPending}
          >
            บันทึกและสร้าง HN
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ชื่อจริง (First Name) *"
            placeholder="เช่น สมชาย"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors((p) => ({ ...p, firstName: '' }));
            }}
            error={errors.firstName}
            autoFocus
          />
          <Input
            label="นามสกุล (Last Name) *"
            placeholder="เช่น ใจดี"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors((p) => ({ ...p, lastName: '' }));
            }}
            error={errors.lastName}
          />
        </div>

        {/* DOB & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Input
            type="date"
            label="วันเดือนปีเกิด (Date of Birth) *"
            value={dob}
            onChange={(e) => {
              setDob(e.target.value);
              if (errors.dob) setErrors((p) => ({ ...p, dob: '' }));
            }}
            error={errors.dob}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[var(--fg)] tracking-tight">
              เพศ (Gender) *
            </label>
            <SegmentedControl<Gender>
              options={[
                { value: 'male', label: 'ชาย' },
                { value: 'female', label: 'หญิง' },
                { value: 'other', label: 'อื่นๆ' },
              ]}
              value={gender}
              onChange={(val) => setGender(val)}
              className="w-full"
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="เบอร์โทรศัพท์ (Phone)"
            placeholder="เช่น 0812345678"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            optional
          />
          <Input
            label="อีเมล (Email)"
            placeholder="เช่น somchai@example.com"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: '' }));
            }}
            error={errors.email}
            optional
          />
        </div>

        {/* National ID */}
        <Input
          label="เลขบัตรประจำตัวประชาชน / Passport"
          placeholder="เลข 13 หลัก"
          value={idCardNumber}
          onChange={(e) => setIdCardNumber(e.target.value)}
          optional
        />

        {/* Allergies Alert */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-rose-600 dark:text-rose-400 tracking-tight flex items-center gap-1.5">
              <span>⚠️</span>
              <span>ประวัติการแพ้ยา / แพ้อาหาร (Allergies)</span>
            </label>
            <span className="text-[11px] text-[var(--muted)]">ไม่บังคับ</span>
          </div>
          <Input
            placeholder="เช่น แพ้ยา Penicillin, แพ้อาหารทะเล"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="border-rose-300 dark:border-rose-900/60 focus:border-rose-500"
          />
        </div>

        {/* Address */}
        <Textarea
          label="ที่อยู่ (Address)"
          placeholder="บ้านเลขที่ ถนน แขวง/ตำบล..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          optional
        />
      </form>
    </Modal>
  );
}
