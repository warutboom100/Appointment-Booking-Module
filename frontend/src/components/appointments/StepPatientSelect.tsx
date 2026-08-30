'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PatientQuickAddModal } from '@/components/patients/PatientQuickAddModal';
import { usePatients } from '@/hooks/usePatients';
import { useDebounce } from '@/hooks/useDebounce';
import { calculateAge, genderLabel, formatPhone } from '@/lib/format';
import type { Patient } from '@/types';

interface StepPatientSelectProps {
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
}

export function StepPatientSelect({
  selectedPatient,
  onSelectPatient,
}: StepPatientSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 350);

  const { data, isLoading } = usePatients({
    search: debouncedSearch || undefined,
    limit: 8,
  });

  const patients = data?.data || [];

  const handlePatientCreated = (newPatient: Patient) => {
    onSelectPatient(newPatient);
    setIsQuickAddOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 animate-pop">
      {/* Header & Search / Add row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            placeholder="ค้นหาด้วยเลข HN, ชื่อ-นามสกุล, หรือเบอร์โทรศัพท์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setIsQuickAddOpen(true)}
          className="whitespace-nowrap"
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          ลงทะเบียนคนไข้ใหม่
        </Button>
      </div>

      {/* Selected Patient Banner (if selected) */}
      {selectedPatient && (
        <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-500/30 flex items-center justify-between gap-3 animate-pop">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {selectedPatient.first_name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--fg)]">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </span>
                <Badge variant="teal" size="sm" className="font-mono">
                  {selectedPatient.hn}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {genderLabel(selectedPatient.gender)}{' '}
                {calculateAge(selectedPatient.date_of_birth) !== null
                  ? `• อายุ ${calculateAge(selectedPatient.date_of_birth)} ปี`
                  : ''}{' '}
                • {formatPhone(selectedPatient.phone)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>เลือกแล้ว</span>
          </div>
        </div>
      )}

      {/* Patients List Grid */}
      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          {searchTerm ? 'ผลการค้นหาคนไข้' : 'รายชื่อคนไข้ล่าสุด'}
        </label>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            <span>กำลังค้นหาข้อมูล...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]">
            <p className="text-sm font-medium text-[var(--fg)]">ไม่พบข้อมูลคนไข้</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น หรือกดลงทะเบียนคนไข้ใหม่' : 'ยังไม่มีข้อมูลคนไข้ในระบบ'}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => setIsQuickAddOpen(true)}
            >
              + ลงทะเบียนคนไข้ใหม่ทันที
            </Button>
          </div>
        ) : (
          patients.map((patient) => {
            const isSelected = selectedPatient?.id === patient.id;
            const age = calculateAge(patient.date_of_birth);

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-[var(--surface-subtle)] text-[var(--fg)] border border-[var(--border)]'
                    }`}
                  >
                    {patient.first_name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--fg)]">
                        {patient.first_name} {patient.last_name}
                      </span>
                      <Badge variant="teal" size="sm" className="font-mono">
                        {patient.hn}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {genderLabel(patient.gender)} {age !== null ? `• อายุ ${age} ปี` : ''} • {formatPhone(patient.phone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {patient.allergies && (
                    <Badge variant="rose" size="sm" dot className="max-w-[120px] truncate hidden sm:inline-flex">
                      {patient.allergies}
                    </Badge>
                  )}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-[var(--border)] bg-[var(--surface)]'
                    }`}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Modal */}
      <PatientQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={handlePatientCreated}
      />
    </div>
  );
}
