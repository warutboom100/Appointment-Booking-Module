'use client';

import { useState, useMemo } from 'react';
import { useDepartments } from '@/hooks/useDepartments';
import { useDoctors } from '@/hooks/useDoctors';
import { useAllSchedules, useAllOverrides } from '@/hooks/useSchedules';
import { MonthlyCalendarView } from '@/components/schedules/MonthlyCalendarView';
import { WeeklyTimetableGrid } from '@/components/schedules/WeeklyTimetableGrid';
import { OverridesListTable } from '@/components/schedules/OverridesListTable';
import { ScheduleModal } from '@/components/schedules/ScheduleModal';
import { OverrideModal } from '@/components/schedules/OverrideModal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import type { DoctorSchedule, ScheduleOverride } from '@/types';

export default function SchedulesPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'weekly' | 'overrides'>('calendar');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<DoctorSchedule | null>(null);

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideToEdit, setOverrideToEdit] = useState<ScheduleOverride | null>(null);
  const [overrideDateParam, setOverrideDateParam] = useState<string>('');

  // 1. Fetch departments
  const { data: deptResponse, isLoading: isDeptLoading } = useDepartments({ limit: 100 });
  const departments = deptResponse?.data || [];

  // 2. Fetch active doctors
  const { data: doctorsResponse, isLoading: isDoctorsLoading } = useDoctors({
    ...(selectedDeptId ? { department_id: selectedDeptId } : {}),
    is_active: true,
    limit: 100,
  });
  const doctors = useMemo(
    () => (doctorsResponse?.data || []).filter((d) => d.is_active),
    [doctorsResponse?.data],
  );

  // 3. Bulk fetch schedules & overrides in 2 clean queries
  const {
    data: rawSchedules = [],
    isLoading: isSchedulesLoading,
    refetch: refetchSchedules,
  } = useAllSchedules(selectedDeptId ? { department_id: selectedDeptId } : undefined);

  const {
    data: rawOverrides = [],
    isLoading: isOverridesLoading,
    refetch: refetchOverrides,
  } = useAllOverrides(selectedDeptId ? { department_id: selectedDeptId } : undefined);

  const handleRefreshAll = () => {
    refetchSchedules();
    refetchOverrides();
  };

  // Group schedules by doctor_id
  const allSchedules = useMemo(() => {
    const map: Record<string, DoctorSchedule[]> = {};
    rawSchedules.forEach((sch) => {
      if (!map[sch.doctor_id]) map[sch.doctor_id] = [];
      map[sch.doctor_id].push(sch);
    });
    return map;
  }, [rawSchedules]);

  // Group overrides by doctor_id
  const allOverrides = useMemo(() => {
    const map: Record<string, ScheduleOverride[]> = {};
    rawOverrides.forEach((ov) => {
      if (!map[ov.doctor_id]) map[ov.doctor_id] = [];
      map[ov.doctor_id].push(ov);
    });
    return map;
  }, [rawOverrides]);

  const isLoadingSchedules = isSchedulesLoading || isOverridesLoading;

  // Filtered doctors based on doctor select dropdown
  const displayDoctors = useMemo(() => {
    return selectedDoctorId
      ? doctors.filter((d) => d.id === selectedDoctorId)
      : doctors;
  }, [doctors, selectedDoctorId]);

  return (
    <div className="flex flex-col gap-6 stagger">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)]">
            ตารางออกตรวจแพทย์ (Doctor Schedules)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            จัดการตารางออกตรวจประจำสัปดาห์ ปฏิทินรายเดือน และบันทึกวันหยุดแพทย์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setOverrideToEdit(null);
              setOverrideDateParam('');
              setIsOverrideModalOpen(true);
            }}
          >
            🏖️ บันทึกวันหยุด / เวรพิเศษ
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setScheduleToEdit(null);
              setIsScheduleModalOpen(true);
            }}
            leftIcon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            เพิ่มตารางเวรประจำ
          </Button>
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <Card variant="glass" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Department and Doctor Filters (only for calendar and weekly views) */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {viewMode !== 'overrides' && (
              <>
                <div className="w-full sm:w-48">
                  <Select
                    value={selectedDeptId}
                    onChange={(e) => {
                      setSelectedDeptId(e.target.value);
                      setSelectedDoctorId('');
                    }}
                    options={[
                      { value: '', label: 'ทุกแผนก (All Clinics)' },
                      ...departments.map((d) => ({ value: d.id, label: d.name })),
                    ]}
                  />
                </div>

                <div className="w-full sm:w-56">
                  <Select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    options={[
                      { value: '', label: 'แพทย์ทุกท่าน (All Doctors)' },
                      ...doctors.map((d) => ({
                        value: d.id,
                        label: `${d.title || ''} ${d.first_name} ${d.last_name}`,
                      })),
                    ]}
                  />
                </div>
              </>
            )}
          </div>

          {/* Apple Segmented View Toggle */}
          <SegmentedControl<'calendar' | 'weekly' | 'overrides'>
            options={[
              { value: 'calendar', label: '📅 ปฏิทินรายเดือน' },
              { value: 'weekly', label: '📋 ตารางเวรประจำ' },
              { value: 'overrides', label: '🏖️ วันหยุด & เวรพิเศษ' },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val)}
          />
        </div>
      </Card>

      {/* Content View */}
      {isDeptLoading || isDoctorsLoading || isLoadingSchedules ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-[var(--muted)]">กำลังดึงข้อมูลตารางออกตรวจแพทย์...</span>
        </div>
      ) : viewMode === 'calendar' ? (
        <MonthlyCalendarView
          doctors={displayDoctors}
          allSchedules={allSchedules}
          allOverrides={allOverrides}
          onAddOverrideForDate={(date) => {
            setOverrideToEdit(null);
            setOverrideDateParam(date);
            setIsOverrideModalOpen(true);
          }}
          onEditOverride={(override) => {
            setOverrideToEdit(override);
            setIsOverrideModalOpen(true);
          }}
          onSuccess={handleRefreshAll}
        />
      ) : viewMode === 'weekly' ? (
        <WeeklyTimetableGrid
          doctors={displayDoctors}
          allSchedules={allSchedules}
          onEditSchedule={(schedule) => {
            setScheduleToEdit(schedule);
            setIsScheduleModalOpen(true);
          }}
        />
      ) : (
        <OverridesListTable
          doctors={doctors}
          departments={departments}
          allOverrides={allOverrides}
          onEditOverride={(override) => {
            setOverrideToEdit(override);
            setIsOverrideModalOpen(true);
          }}
          onOpenCreateModal={() => {
            setOverrideToEdit(null);
            setOverrideDateParam('');
            setIsOverrideModalOpen(true);
          }}
          onSuccess={handleRefreshAll}
        />
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
        }}
        doctors={doctors}
        selectedDoctorId={selectedDoctorId || undefined}
        scheduleToEdit={scheduleToEdit}
        onSuccess={handleRefreshAll}
      />

      {/* Override Modal */}
      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setOverrideToEdit(null);
          setOverrideDateParam('');
        }}
        doctors={doctors}
        selectedDoctorId={selectedDoctorId || undefined}
        defaultDate={overrideDateParam || undefined}
        overrideToEdit={overrideToEdit}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
}
