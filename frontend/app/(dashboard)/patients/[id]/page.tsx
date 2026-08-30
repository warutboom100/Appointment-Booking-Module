'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { usePatient, usePatientHistory } from '@/hooks/usePatients';
import { PatientHistoryTimeline } from '@/components/patients/PatientHistoryTimeline';
import { BookingModal } from '@/components/appointments/BookingModal';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { formatDate, calculateAge, genderLabel, formatPhone } from '@/lib/format';

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { data: patient, isLoading: isPatientLoading, error: patientError } = usePatient(patientId);
  const { data: appointments, isLoading: isHistoryLoading } = usePatientHistory(patientId);

  if (isPatientLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-sm text-[var(--muted)]">กำลังดึงข้อมูลเวชระเบียนผู้ป่วย...</span>
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-lg font-semibold text-[var(--fg)] mb-2">ไม่พบข้อมูลผู้ป่วย</h3>
        <p className="text-sm text-[var(--muted)] mb-6">
          รหัสผู้ป่วยนี้อาจไม่มีอยู่ในระบบ หรือถูกลบไปแล้ว
        </p>
        <Link href="/patients">
          <Button variant="secondary">ย้อนกลับไปหน้ารายชื่อผู้ป่วย</Button>
        </Link>
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="flex flex-col gap-6 stagger">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Link href="/patients" className="hover:text-[var(--fg)] transition-colors no-underline">
              เวชระเบียนผู้ป่วย
            </Link>
            <span>/</span>
            <span className="text-[var(--fg)] font-medium font-mono">{patient.hn}</span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)]">
              {patient.first_name} {patient.last_name}
            </h2>
            <Badge variant="teal" size="md" className="font-mono">
              {patient.hn}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsBookingOpen(true)}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            นัดหมายตรวจแพทย์
          </Button>
          <Link href="/patients">
            <Button variant="secondary" size="sm">
              ← ย้อนกลับ
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Profile Bio Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card variant="glass">
            <CardHeader title="ข้อมูลเวชระเบียนผู้ป่วย" />

            <div className="flex flex-col gap-4 text-xs">
              {/* Avatar & HN */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {patient.first_name.slice(0, 1)}
                  {patient.last_name.slice(0, 1)}
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-[var(--fg)]">
                    {patient.first_name} {patient.last_name}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    HN: {patient.hn}
                  </span>
                </div>
              </div>

              {/* General Bio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <span className="text-[var(--muted)]">เพศ:</span>
                  <span className="font-semibold text-[var(--fg)] mt-0.5">
                    {genderLabel(patient.gender)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--muted)]">อายุ:</span>
                  <span className="font-semibold text-[var(--fg)] mt-0.5">
                    {age !== null ? `${age} ปี` : '-'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[var(--muted)]">วันเดือนปีเกิด:</span>
                <span className="font-semibold text-[var(--fg)] mt-0.5">
                  {formatDate(patient.date_of_birth)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[var(--muted)]">เบอร์โทรศัพท์:</span>
                <span className="font-semibold text-[var(--fg)] font-mono mt-0.5">
                  {formatPhone(patient.phone)}
                </span>
              </div>

              {patient.email && (
                <div className="flex flex-col">
                  <span className="text-[var(--muted)]">อีเมล:</span>
                  <span className="font-medium text-[var(--fg)] mt-0.5 truncate">
                    {patient.email}
                  </span>
                </div>
              )}

              {patient.id_card_number && (
                <div className="flex flex-col">
                  <span className="text-[var(--muted)]">เลขบัตรประจำตัว:</span>
                  <span className="font-medium text-[var(--fg)] font-mono mt-0.5">
                    {patient.id_card_number}
                  </span>
                </div>
              )}

              {patient.address && (
                <div className="flex flex-col">
                  <span className="text-[var(--muted)]">ที่อยู่:</span>
                  <span className="text-[var(--fg)] mt-0.5 leading-relaxed">
                    {patient.address}
                  </span>
                </div>
              )}

              {/* Allergies Highlight Card */}
              <div className="mt-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block mb-1">
                  ⚠️ ประวัติการแพ้ยาและสารก่อภูมิแพ้:
                </span>
                <span className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                  {patient.allergies || 'ไม่มีประวัติแพ้ยา'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Appointment History Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card variant="default">
            <CardHeader
              title="ประวัติการนัดหมายและการตรวจ (Appointment History)"
              subtitle={`พบทั้งหมด ${appointments?.length || 0} รายการ`}
            />

            <PatientHistoryTimeline
              appointments={appointments}
              isLoading={isHistoryLoading}
            />
          </Card>
        </div>
      </div>

      {/* Booking Modal with pre-selected patient */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        defaultPatient={patient}
      />
    </div>
  );
}
