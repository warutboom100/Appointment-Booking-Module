'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useDepartments } from '@/hooks/useDepartments';
import { useDoctors } from '@/hooks/useDoctors';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import type { Doctor, AppointmentType, Department } from '@/types';

interface StepDoctorSelectProps {
  selectedDepartment: Department | null;
  selectedDoctor: Doctor | null;
  selectedType: AppointmentType | null;
  onSelectDepartment: (dept: Department | null) => void;
  onSelectDoctor: (doctor: Doctor) => void;
  onSelectType: (type: AppointmentType) => void;
}

export function StepDoctorSelect({
  selectedDepartment,
  selectedDoctor,
  selectedType,
  onSelectDepartment,
  onSelectDoctor,
  onSelectType,
}: StepDoctorSelectProps) {
  const [departmentId, setDepartmentId] = useState(selectedDepartment?.id || '');

  const { data: deptResponse, isLoading: isDeptLoading } = useDepartments({ limit: 100 });
  const departments = deptResponse?.data || [];

  const { data: docResponse, isLoading: isDocLoading } = useDoctors({
    department_id: departmentId || undefined,
    is_active: true,
    limit: 50,
  });
  const doctors = docResponse?.data || [];

  const { data: typeResponse, isLoading: isTypesLoading } = useAppointmentTypes({
    limit: 100,
    is_active: true,
  });
  const appointmentTypes = typeResponse?.data || [];

  const handleDeptChange = (deptId: string) => {
    setDepartmentId(deptId);
    const foundDept = departments.find((d) => d.id === deptId) || null;
    onSelectDepartment(foundDept);
  };

  return (
    <div className="flex flex-col gap-6 animate-pop">
      {/* 1. Department Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          1. เลือกแผนกการรักษา (Department)
        </label>
        <Select
          value={departmentId}
          onChange={(e) => handleDeptChange(e.target.value)}
          disabled={isDeptLoading}
          options={[
            { value: '', label: 'ทุกแผนก (All Departments)' },
            ...departments.map((d) => ({
              value: d.id,
              label: `${d.name} ${d.location ? `(${d.location})` : ''}`,
            })),
          ]}
        />
      </div>

      {/* 2. Doctor Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          2. เลือกแพทย์ผู้ตรวจ (Doctor) *
        </label>

        {isDocLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            <span>กำลังโหลดรายชื่อแพทย์...</span>
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-6 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]">
            <p className="text-xs text-[var(--muted)]">ไม่พบแพทย์ที่เปิดให้บริการในแผนกนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {doctors.map((doctor) => {
              const isSelected = selectedDoctor?.id === doctor.id;
              const deptName = departments.find((d) => d.id === doctor.department_id)?.name || doctor.department_name;

              return (
                <div
                  key={doctor.id}
                  onClick={() => onSelectDoctor(doctor)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-[var(--surface-subtle)] text-[var(--fg)] border border-[var(--border)]'
                      }`}
                    >
                      {doctor.first_name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--fg)] leading-tight">
                        {doctor.title || ''} {doctor.first_name} {doctor.last_name}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        {deptName || 'แผนกผู้ป่วยนอก'} {doctor.room_number ? `• ห้อง ${doctor.room_number}` : ''}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-[var(--border)] bg-[var(--surface)]'
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Appointment Type Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          3. เลือกประเภทการนัดหมาย (Appointment Type) *
        </label>

        {isTypesLoading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            <span>กำลังโหลดประเภทการนัดหมาย...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {appointmentTypes.map((type) => {
              const isSelected = selectedType?.id === type.id;

              return (
                <div
                  key={type.id}
                  onClick={() => onSelectType(type)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--fg)]">{type.name}</span>
                      <Badge variant="blue" size="sm">
                        ⏱️ {type.duration_minutes} นาที
                      </Badge>
                    </div>
                    {type.description && (
                      <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-1">
                        {type.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-[var(--border)] bg-[var(--surface)]'
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
