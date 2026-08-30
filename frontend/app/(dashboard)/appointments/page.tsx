'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/Pagination';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { BookingModal } from '@/components/appointments/BookingModal';
import { CancelAppointmentModal } from '@/components/appointments/CancelAppointmentModal';
import { RescheduleAppointmentModal } from '@/components/appointments/RescheduleAppointmentModal';
import { useAppointments, useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { useDoctors } from '@/hooks/useDoctors';
import { useDepartments } from '@/hooks/useDepartments';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatDate, formatTime, getAppointmentStatusMeta } from '@/lib/format';
import type { Appointment, AppointmentStatus } from '@/types';

export default function AppointmentsPage() {
  const { addToast } = useToast();
  const updateStatusMutation = useUpdateAppointmentStatus();

  // Filters State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<{
    appointment: Appointment;
    nextStatus: AppointmentStatus;
    actionLabel: string;
  } | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 350);

  // Queries
  const { data: deptResponse } = useDepartments({ limit: 100 });
  const departments = deptResponse?.data || [];

  const { data: docResponse } = useDoctors({
    department_id: selectedDepartmentId || undefined,
    limit: 100,
  });
  const doctors = docResponse?.data || [];

  const { data, isLoading } = useAppointments({
    page,
    limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    doctor_id: selectedDoctorId || undefined,
    department_id: selectedDepartmentId || undefined,
    date: dateFilter || undefined,
  });

  const appointments = data?.data || [];
  const meta = data?.meta;

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSelectedDoctorId('');
    setSelectedDepartmentId('');
    setDateFilter('');
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    selectedDoctorId !== '' ||
    selectedDepartmentId !== '' ||
    dateFilter !== '' ||
    searchTerm !== '';

  const handleUpdateStatus = async (id: string, status: AppointmentStatus, label: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      addToast({
        title: 'อัปเดตสถานะสำเร็จ',
        description: `เปลี่ยนสถานะนัดหมายเป็น "${label}" เรียบร้อยแล้ว`,
        type: 'success',
      });
      setStatusConfirmTarget(null);
    } catch (error) {
      addToast({
        title: 'ไม่สามารถอัปเดตสถานะได้',
        description: getErrorMessage(error),
        type: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 stagger">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)]">
            รายการนัดหมายผู้ป่วย (Appointments)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            จัดการคิวนัดหมาย ตรวจสอบสถานะ และอัปเดตขั้นตอนการรับบริการผู้ป่วยนอก (OPD)
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setIsBookingOpen(true)}
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          + นัดหมายใหม่
        </Button>
      </div>

      {/* Filter Toolbar Card */}
      <Card variant="glass" className="p-4 flex flex-col gap-4">
        {/* Row 1: Search, Date, Doctor, Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              วันที่นัดหมาย
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              แผนกการรักษา
            </label>
            <Select
              value={selectedDepartmentId}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value);
                setSelectedDoctorId('');
                setPage(1);
              }}
              options={[
                { value: '', label: 'ทุกแผนก (All)' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              แพทย์ผู้ตรวจ
            </label>
            <Select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'แพทย์ทุกท่าน (All)' },
                ...doctors.map((d) => ({
                  value: d.id,
                  label: `${d.title || ''} ${d.first_name} ${d.last_name}`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              สถานะการนัดหมาย
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'ทุกสถานะ (All Statuses)' },
                { value: 'booked', label: '🔵 นัดหมายแล้ว (Booked)' },
                { value: 'confirmed', label: '🟢 ยืนยันนัดหมาย (Confirmed)' },
                { value: 'checked_in', label: '🟡 มาถึงแล้ว (Checked-in)' },
                { value: 'in_progress', label: '🟣 กำลังตรวจ (In Progress)' },
                { value: 'completed', label: '✅ ตรวจเสร็จสิ้น (Completed)' },
                { value: 'cancelled', label: '🔴 ยกเลิกแล้ว (Cancelled)' },
                { value: 'no_show', label: '⚪ ไม่มาตามนัด (No-show)' },
                { value: 'rescheduled', label: '🔄 เลื่อนนัดแล้ว (Rescheduled)' },
              ]}
            />
          </div>
        </div>

        {/* Row 2: Active Filters summary & Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
            <span className="text-[var(--muted)]">กำลังกรองข้อมูลนัดหมาย</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-[var(--accent)]"
            >
              ล้างตัวกรองทั้งหมด
            </Button>
          </div>
        )}
      </Card>

      {/* Appointments Data Table */}
      <Card variant="glass" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                <th className="py-3 px-4">วันและเวลา</th>
                <th className="py-3 px-4">ข้อมูลคนไข้</th>
                <th className="py-3 px-4">แพทย์และแผนก</th>
                <th className="py-3 px-4">ประเภทนัด / อาการ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
                      <span className="text-xs text-[var(--muted)]">กำลังโหลดรายการนัดหมาย...</span>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📅</span>
                      <p className="text-sm font-semibold text-[var(--fg)]">ไม่พบข้อมูลนัดหมาย</p>
                      <p className="text-xs text-[var(--muted)] max-w-sm">
                        {hasActiveFilters
                          ? 'ไม่พบนัดหมายที่ตรงกับเงื่อนไขการค้นหา ลองปรับหรือล้างตัวกรอง'
                          : 'ยังไม่มีรายการนัดหมายในระบบ เริ่มต้นสร้างนัดหมายใหม่'}
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsBookingOpen(true)}
                      >
                        + สร้างนัดหมายใหม่
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((item) => {
                  const statusMeta = getAppointmentStatusMeta(item.status);

                  return (
                    <tr key={item.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      {/* Column 1: Date & Time */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-[var(--fg)]">
                            {formatDate(item.appointment_date)}
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-300 mt-0.5">
                            {formatTime(item.start_time)} - {formatTime(item.end_time)} น.
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Patient Info */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {(item.patient_name || item.patient?.first_name || 'P').slice(0, 1)}
                          </div>
                          <div className="flex flex-col">
                            <Link
                              href={`/patients/${item.patient_id}`}
                              className="font-semibold text-xs text-[var(--fg)] hover:text-[var(--accent)] hover:underline flex items-center gap-1.5"
                            >
                              <span>
                                {item.patient_name || `${item.patient?.first_name || ''} ${item.patient?.last_name || ''}`.trim() || 'ผู้ป่วย'}
                              </span>
                            </Link>
                            <span className="text-[11px] text-[var(--muted)] font-mono">
                              HN: {item.patient_hn || item.patient?.hn || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Doctor & Department */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-[var(--fg)]">
                            {item.doctor_name || `${item.doctor?.title || ''} ${item.doctor?.first_name || ''} ${item.doctor?.last_name || ''}`.trim() || 'แพทย์ประจำแผนก'}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            {item.department_name || item.department?.name || item.doctor?.department_name || 'แผนกผู้ป่วยนอก'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Type & Chief Complaint */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="blue" size="sm">
                              {item.appointment_type_name || item.appointment_type?.name || 'ตรวจทั่วไป'}
                            </Badge>
                            {(item.appointment_type_duration || item.appointment_type?.duration_minutes) && (
                              <span className="text-[10px] text-[var(--muted)] font-mono">
                                {item.appointment_type_duration || item.appointment_type?.duration_minutes}m
                              </span>
                            )}
                          </div>
                          {item.reason_for_visit && (
                            <p className="text-[11px] text-[var(--muted)] truncate" title={item.reason_for_visit}>
                              {item.reason_for_visit}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <Badge variant={statusMeta.variant} size="sm" dot>
                            {statusMeta.label}
                          </Badge>
                          {item.cancellation_reason && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-[140px]" title={item.cancellation_reason}>
                              เหตุผล: {item.cancellation_reason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 6: Actions based on Lifecycle */}
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Booked: Can Confirm, Reschedule, Cancel */}
                          {item.status === 'booked' && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs text-teal-700 dark:text-teal-300 border-teal-500/40 hover:bg-teal-500/10"
                                onClick={() =>
                                  setStatusConfirmTarget({
                                    appointment: item,
                                    nextStatus: 'confirmed',
                                    actionLabel: 'ยืนยันนัดหมาย (Confirm)',
                                  })
                                }
                              >
                                ✓ ยืนยันนัด
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => setRescheduleTarget(item)}
                              >
                                🗓️ เลื่อนนัด
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-rose-600 hover:bg-rose-500/10"
                                onClick={() => setCancelTarget(item)}
                              >
                                ✕ ยกเลิก
                              </Button>
                            </>
                          )}

                          {/* Confirmed: Can Check-in, Reschedule, Cancel, No-show */}
                          {item.status === 'confirmed' && (
                            <>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() =>
                                  setStatusConfirmTarget({
                                    appointment: item,
                                    nextStatus: 'checked_in',
                                    actionLabel: 'คนไข้มาถึงแล้ว (Check-in)',
                                  })
                                }
                              >
                                🏥 เช็คอิน
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => setRescheduleTarget(item)}
                              >
                                🗓️ เลื่อนนัด
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-rose-600 hover:bg-rose-500/10"
                                onClick={() => setCancelTarget(item)}
                              >
                                ✕ ยกเลิก
                              </Button>
                            </>
                          )}

                          {/* Checked-in: Can Start Consultation, No-show */}
                          {item.status === 'checked_in' && (
                            <>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() =>
                                  setStatusConfirmTarget({
                                    appointment: item,
                                    nextStatus: 'in_progress',
                                    actionLabel: 'เริ่มการตรวจรักษา (Start Consultation)',
                                  })
                                }
                              >
                                🩺 เริ่มตรวจ
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-[var(--muted)]"
                                onClick={() =>
                                  setStatusConfirmTarget({
                                    appointment: item,
                                    nextStatus: 'no_show',
                                    actionLabel: 'ไม่มาตามนัด (No-show)',
                                  })
                                }
                              >
                                🚫 ไม่มา
                              </Button>
                            </>
                          )}

                          {/* In Progress: Can Complete Consultation */}
                          {item.status === 'in_progress' && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() =>
                                setStatusConfirmTarget({
                                  appointment: item,
                                  nextStatus: 'completed',
                                  actionLabel: 'ตรวจเสร็จสิ้น (Complete Visit)',
                                })
                              }
                            >
                              ✓ ตรวจเสร็จสิ้น
                            </Button>
                          )}

                          {/* Terminal States */}
                          {item.status === 'completed' && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              เสร็จสิ้น
                            </span>
                          )}
                          {item.status === 'cancelled' && (
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                              ยกเลิกแล้ว
                            </span>
                          )}
                          {item.status === 'no_show' && (
                            <span className="text-xs text-[var(--muted)] font-medium">
                              ไม่มาตามนัด
                            </span>
                          )}
                          {item.status === 'rescheduled' && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              เลื่อนแล้ว
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {meta && meta.totalPages > 1 && (
          <Pagination
            meta={meta}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        )}
      </Card>

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* Cancel Modal */}
      <CancelAppointmentModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        appointment={cancelTarget}
      />

      {/* Reschedule Modal */}
      <RescheduleAppointmentModal
        isOpen={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        appointment={rescheduleTarget}
      />

      {/* Status Transition Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirmTarget}
        title={statusConfirmTarget?.actionLabel || 'ยืนยันการเปลี่ยนสถานะ'}
        message={`ต้องการเปลี่ยนสถานะนัดหมายของ ${statusConfirmTarget?.appointment.patient?.first_name} ${statusConfirmTarget?.appointment.patient?.last_name} เป็น "${statusConfirmTarget?.actionLabel}" หรือไม่?`}
        confirmLabel="ยืนยันเปลี่ยนสถานะ"
        variant="primary"
        isLoading={updateStatusMutation.isPending}
        onCancel={() => setStatusConfirmTarget(null)}
        onConfirm={() => {
          if (statusConfirmTarget) {
            handleUpdateStatus(
              statusConfirmTarget.appointment.id,
              statusConfirmTarget.nextStatus,
              statusConfirmTarget.actionLabel,
            );
          }
        }}
      />
    </div>
  );
}
