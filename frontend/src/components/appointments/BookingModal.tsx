'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StepPatientSelect } from './StepPatientSelect';
import { StepDoctorSelect } from './StepDoctorSelect';
import { StepSlotPicker } from './StepSlotPicker';
import { StepSummaryConfirm } from './StepSummaryConfirm';
import { useBookAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import type { Patient, Doctor, AppointmentType, TimeSlot, Department } from '@/types';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPatient?: Patient | null;
  defaultDoctor?: Doctor | null;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, label: 'เลือกผู้ป่วย' },
  { id: 2, label: 'แพทย์ & แผนก' },
  { id: 3, label: 'วัน & เวลาตรวจ' },
  { id: 4, label: 'สรุปและยืนยัน' },
];

export function BookingModal({
  isOpen,
  onClose,
  defaultPatient,
  defaultDoctor,
  onSuccess,
}: BookingModalProps) {
  const { addToast } = useToast();
  const bookAppointmentMutation = useBookAppointment();

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Reset or initialize state on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setPatient(defaultPatient || null);
      setDoctor(defaultDoctor || null);
      setDepartment(null);
      setAppointmentType(null);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setAppointmentDate(tomorrow.toISOString().split('T')[0]);
      
      setSelectedSlot(null);
      setReasonForVisit('');
      setNotes('');
    }
  }, [isOpen, defaultPatient, defaultDoctor]);

  // Validation per step
  const canProceed = (): boolean => {
    if (currentStep === 1) return !!patient;
    if (currentStep === 2) return !!doctor && !!appointmentType;
    if (currentStep === 3) return !!appointmentDate && !!selectedSlot;
    if (currentStep === 4) return true;
    return false;
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (!patient || !doctor || !appointmentType || !appointmentDate || !selectedSlot) return;

    try {
      await bookAppointmentMutation.mutateAsync({
        patient_id: patient.id,
        doctor_id: doctor.id,
        department_id: doctor.department_id,
        appointment_type_id: appointmentType.id,
        appointment_date: appointmentDate,
        start_time: selectedSlot.start_time,
        reason_for_visit: reasonForVisit.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      addToast({
        title: 'จองนัดหมายสำเร็จ',
        description: `สร้างนัดหมายของ ${patient.first_name} กับ ${doctor.title || ''} ${doctor.first_name} เรียบร้อยแล้ว`,
        type: 'success',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      addToast({
        title: 'ไม่สามารถจองนัดหมายได้',
        description: getErrorMessage(error),
        type: 'error',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="จองคิวนัดหมายแพทย์ (New Appointment)"
      subtitle="ระบบบริการผู้ป่วยนอก OPD Booking Wizard"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-6">
        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between relative px-2 sm:px-6">
          {/* Progress background line */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--border)] -z-0" />
          <div
            className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-teal-600 transition-all duration-300 -z-0"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 80}%` }}
          />

          {STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-teal-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-teal-600 text-white ring-4 ring-teal-500/20 shadow-xs'
                      : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                  }`}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium tracking-tight hidden sm:block ${
                    isCurrent
                      ? 'text-[var(--fg)] font-semibold'
                      : isCompleted
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[360px] flex flex-col justify-between">
          <div>
            {currentStep === 1 && (
              <StepPatientSelect
                selectedPatient={patient}
                onSelectPatient={(p) => setPatient(p)}
              />
            )}

            {currentStep === 2 && (
              <StepDoctorSelect
                selectedDepartment={department}
                selectedDoctor={doctor}
                selectedType={appointmentType}
                onSelectDepartment={setDepartment}
                onSelectDoctor={setDoctor}
                onSelectType={setAppointmentType}
              />
            )}

            {currentStep === 3 && doctor && appointmentType && (
              <StepSlotPicker
                doctor={doctor}
                appointmentType={appointmentType}
                selectedDate={appointmentDate}
                selectedSlot={selectedSlot}
                onSelectDate={(d) => {
                  setAppointmentDate(d);
                  setSelectedSlot(null);
                }}
                onSelectSlot={setSelectedSlot}
              />
            )}

            {currentStep === 4 && patient && doctor && appointmentType && selectedSlot && (
              <StepSummaryConfirm
                patient={patient}
                doctor={doctor}
                department={department}
                appointmentType={appointmentType}
                appointmentDate={appointmentDate}
                selectedSlot={selectedSlot}
                reasonForVisit={reasonForVisit}
                notes={notes}
                onChangeReason={setReasonForVisit}
                onChangeNotes={setNotes}
              />
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-5 mt-6 border-t border-[var(--border-subtle)]">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={currentStep === 1 ? onClose : handleBack}
            >
              {currentStep === 1 ? 'ยกเลิก' : '❮ ย้อนกลับ'}
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!canProceed()}
                onClick={handleNext}
              >
                ขั้นตอนถัดไป ❯
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={bookAppointmentMutation.isPending}
                onClick={handleSubmit}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              >
                {bookAppointmentMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    กำลังบันทึกนัดหมาย...
                  </span>
                ) : (
                  '✓ ยืนยันการจองนัดหมาย'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
