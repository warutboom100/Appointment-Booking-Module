'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { formatDate } from '@/lib/format';
import type { Appointment } from '@/types';

export interface PatientHistoryTimelineProps {
  appointments?: Appointment[];
  isLoading?: boolean;
  onBookAppointment?: () => void;
}

export function PatientHistoryTimeline({
  appointments = [],
  isLoading = false,
  onBookAppointment,
}: PatientHistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="md" />
        <span className="text-xs text-[var(--muted)]">กำลังดึงประวัติการนัดหมาย...</span>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีประวัติการนัดหมาย"
        description="ผู้ป่วยรายนี้ยังไม่เคยมีประวัติการจองนัดหมายในระบบ"
        actionLabel="+ จองนัดหมายแรก"
        onAction={onBookAppointment}
      />
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
      {appointments.map((apt) => {
        return (
          <div key={apt.id} className="relative group">
            {/* Timeline Dot Indicator */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            </div>

            {/* Appointment Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[var(--accent-light)] transition-all">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--fg)]">
                    {formatDate(apt.appointment_date)}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    ({apt.start_time} - {apt.end_time} น.)
                  </span>
                </div>
                <StatusBadge status={apt.status} size="sm" />
              </div>

              {/* Doctor & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--fg)] mb-2.5">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <span>🩺 แพทย์:</span>
                  <span className="font-medium text-[var(--fg)]">
                    {apt.doctor_name || (apt.doctor
                      ? `${apt.doctor.title || ''} ${apt.doctor.first_name} ${apt.doctor.last_name}`.trim()
                      : 'แพทย์ประจำแผนก')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <span>🏥 แผนก:</span>
                  <span className="font-medium text-[var(--fg)]">
                    {apt.department_name || apt.department?.name || 'แผนกผู้ป่วยนอก'}
                  </span>
                </div>
              </div>

              {/* Type & Reason */}
              {(apt.appointment_type_name || apt.appointment_type) && (
                <div className="text-xs text-[var(--muted)] mb-1">
                  ประเภท: <span className="text-[var(--fg)] font-medium">{apt.appointment_type_name || apt.appointment_type?.name}</span>
                  {(apt.appointment_type_duration || apt.appointment_type?.duration_minutes) && (
                    <span className="ml-2 font-mono">({apt.appointment_type_duration || apt.appointment_type?.duration_minutes} นาที)</span>
                  )}
                </div>
              )}

              {apt.reason_for_visit && (
                <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] text-xs text-[var(--muted)]">
                  <span className="font-medium text-[var(--fg)]">อาการเบื้องต้น: </span>
                  <span>{apt.reason_for_visit}</span>
                </div>
              )}

              {apt.cancellation_reason && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                  <span className="font-semibold">สาเหตุการยกเลิก: </span>
                  <span>{apt.cancellation_reason}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
