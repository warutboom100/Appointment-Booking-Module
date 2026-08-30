'use client';

import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatTime, calculateAge, genderLabel, formatPhone } from '@/lib/format';
import type { Patient, Doctor, AppointmentType, TimeSlot, Department } from '@/types';

interface StepSummaryConfirmProps {
  patient: Patient;
  doctor: Doctor;
  department: Department | null;
  appointmentType: AppointmentType;
  appointmentDate: string;
  selectedSlot: TimeSlot;
  reasonForVisit: string;
  notes: string;
  onChangeReason: (val: string) => void;
  onChangeNotes: (val: string) => void;
}

export function StepSummaryConfirm({
  patient,
  doctor,
  department,
  appointmentType,
  appointmentDate,
  selectedSlot,
  reasonForVisit,
  notes,
  onChangeReason,
  onChangeNotes,
}: StepSummaryConfirmProps) {
  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="flex flex-col gap-6 animate-pop">
      {/* Visual Glass Summary Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-subtle)] p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            สรุปข้อมูลการนัดหมาย (Appointment Summary)
          </span>
          <Badge variant="teal" size="sm">
            ยืนยันนัดหมาย
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Patient Info */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">ข้อมูลผู้ป่วย</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--fg)]">
                {patient.first_name} {patient.last_name}
              </span>
              <Badge variant="teal" size="sm" className="font-mono">
                {patient.hn}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {genderLabel(patient.gender)} {age !== null ? `• อายุ ${age} ปี` : ''} • {formatPhone(patient.phone)}
            </p>
            {patient.allergies && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                ⚠️ แพ้ยา: {patient.allergies}
              </p>
            )}
          </div>

          {/* Doctor Info */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">แพทย์และแผนก</span>
            <p className="font-semibold text-[var(--fg)]">
              {doctor.title || ''} {doctor.first_name} {doctor.last_name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {department?.name || doctor.department_name || 'แผนกผู้ป่วยนอก'}{' '}
              {doctor.room_number ? `• ห้องตรวจ ${doctor.room_number}` : ''}
            </p>
            {doctor.specialization && (
              <p className="text-xs text-[var(--muted)] truncate">
                {doctor.specialization}
              </p>
            )}
          </div>

          {/* Type Info */}
          <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-medium text-[var(--muted)]">ประเภทการนัด</span>
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="md">
                {appointmentType.name}
              </Badge>
              <span className="text-xs text-[var(--muted)] font-mono">
                ⏱️ {appointmentType.duration_minutes} นาที
              </span>
            </div>
          </div>

          {/* Date & Time Info */}
          <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-medium text-[var(--muted)]">วันและเวลาที่นัดตรวจ</span>
            <p className="font-semibold text-[var(--fg)]">
              📅 {formatDate(appointmentDate)}
            </p>
            <p className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-300">
              ⏰ {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)} น.
            </p>
          </div>
        </div>
      </div>

      {/* Inputs for Chief Complaint & Notes */}
      <div className="flex flex-col gap-4">
        <Textarea
          label="อาการสำคัญ / สาเหตุที่มาพบแพทย์ (Chief Complaint)"
          placeholder="เช่น มีไข้สูง 3 วัน ปวดศีรษะ, นัดตรวจติดตามผลเลือด..."
          value={reasonForVisit}
          onChange={(e) => onChangeReason(e.target.value)}
          rows={3}
          optional
        />

        <Textarea
          label="หมายเหตุเพิ่มเติม (Internal Notes)"
          placeholder="บันทึกช่วยจำสำหรับเจ้าหน้าที่..."
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          rows={2}
          optional
        />
      </div>
    </div>
  );
}
