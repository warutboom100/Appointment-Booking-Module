'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { deleteDoctorOverrideApi } from '@/api/schedule.api';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/api/client';
import { formatDate, formatTime } from '@/lib/format';
import type { ScheduleOverride, Doctor, Department } from '@/types';

interface OverridesListTableProps {
  doctors: Doctor[];
  departments: Department[];
  allOverrides: Record<string, ScheduleOverride[]>;
  onEditOverride: (override: ScheduleOverride) => void;
  onSuccess: () => void;
  onOpenCreateModal: () => void;
}

export function OverridesListTable({
  doctors,
  departments,
  allOverrides,
  onEditOverride,
  onSuccess,
  onOpenCreateModal,
}: OverridesListTableProps) {
  const { addToast } = useToast();

  // Filters State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'off' | 'extra'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Delete State
  const [overrideToDelete, setOverrideToDelete] = useState<ScheduleOverride | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Flatten and enhance all overrides from all doctors
  const flatOverrides = useMemo(() => {
    const list: (ScheduleOverride & { doctor?: Doctor; departmentName?: string })[] = [];

    Object.entries(allOverrides).forEach(([docId, overrides]) => {
      const doc = doctors.find((d) => d.id === docId);
      const dept = departments.find((dept) => dept.id === doc?.department_id);

      overrides.forEach((o) => {
        list.push({
          ...o,
          doctor: doc,
          doctor_first_name: doc?.first_name || o.doctor_first_name,
          doctor_last_name: doc?.last_name || o.doctor_last_name,
          doctor_title: doc?.title || o.doctor_title,
          department_id: doc?.department_id || o.department_id,
          departmentName: dept?.name || o.department_name,
        });
      });
    });

    // Sort by date ascending
    return list.sort((a, b) => a.override_date.localeCompare(b.override_date));
  }, [allOverrides, doctors, departments]);

  // Apply filters
  const filteredOverrides = useMemo(() => {
    return flatOverrides.filter((item) => {
      if (selectedDoctorId && item.doctor_id !== selectedDoctorId) return false;
      if (selectedDeptId && item.department_id !== selectedDeptId) return false;
      if (typeFilter === 'off' && item.is_available) return false;
      if (typeFilter === 'extra' && !item.is_available) return false;
      if (fromDate && item.override_date < fromDate) return false;
      if (toDate && item.override_date > toDate) return false;
      return true;
    });
  }, [flatOverrides, selectedDoctorId, selectedDeptId, typeFilter, fromDate, toDate]);

  // Summary counts
  const totalCount = flatOverrides.length;
  const leaveCount = flatOverrides.filter((o) => !o.is_available).length;
  const extraCount = flatOverrides.filter((o) => o.is_available).length;

  const handleClearFilters = () => {
    setSelectedDoctorId('');
    setSelectedDeptId('');
    setTypeFilter('all');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters =
    selectedDoctorId !== '' ||
    selectedDeptId !== '' ||
    typeFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const handleDelete = async () => {
    if (!overrideToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoctorOverrideApi(overrideToDelete.id);
      addToast({
        title: 'ลบรายการสำเร็จ',
        description: 'ลบรายการวันหยุด/เวรพิเศษ และคืนสิทธิ์สู่ตารางเวรปกติเรียบร้อยแล้ว',
        type: 'success',
      });
      setOverrideToDelete(null);
      onSuccess();
    } catch (error) {
      addToast({
        title: 'ไม่สามารถลบรายการได้',
        description: getErrorMessage(error),
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-pop">
      {/* Quick Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card variant="glass" className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[var(--muted)]">ข้อยกเว้นตารางตรวจทั้งหมด</span>
            <p className="text-2xl font-bold text-[var(--fg)] mt-1 font-mono">{totalCount}</p>
          </div>
          <span className="text-2xl">📋</span>
        </Card>

        <Card variant="glass" className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[var(--muted)]">วันหยุดแพทย์ (Leaves/Off)</span>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">{leaveCount}</p>
          </div>
          <span className="text-2xl">🏖️</span>
        </Card>

        <Card variant="glass" className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[var(--muted)]">เวรตรวจพิเศษ (Extra Shifts)</span>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1 font-mono">{extraCount}</p>
          </div>
          <span className="text-2xl">⏰</span>
        </Card>
      </div>

      {/* Filter Toolbar Card */}
      <Card variant="glass" className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              แผนกการรักษา
            </label>
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

          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              แพทย์ผู้ตรวจ
            </label>
            <Select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              options={[
                { value: '', label: 'แพทย์ทุกท่าน (All Doctors)' },
                ...doctors
                  .filter((doc) => (selectedDeptId ? doc.department_id === selectedDeptId : true))
                  .map((d) => ({
                    value: d.id,
                    label: `${d.title || ''} ${d.first_name} ${d.last_name}`,
                  })),
              ]}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              ประเภทรายการ
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'ทั้งหมด (All Types)' },
                { value: 'off', label: '🏖️ วันหยุดแพทย์ (Off)' },
                { value: 'extra', label: '⏰ เวรพิเศษ (Extra Shift)' },
              ]}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
              ตั้งแต่วันที่
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
            <span className="text-[var(--muted)]">
              กรองพบ {filteredOverrides.length} จาก {totalCount} รายการ
            </span>
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

      {/* Table Container */}
      <Card variant="glass" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                <th className="py-3 px-4">วันที่</th>
                <th className="py-3 px-4">แพทย์ผู้ตรวจ</th>
                <th className="py-3 px-4">ประเภทรายการ</th>
                <th className="py-3 px-4">ช่วงเวลาทำการ</th>
                <th className="py-3 px-4">เหตุผล / บันทึกช่วยจำ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredOverrides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🏖️</span>
                      <p className="text-sm font-semibold text-[var(--fg)]">ไม่พบรายการข้อยกเว้นตารางตรวจ</p>
                      <p className="text-xs text-[var(--muted)] max-w-sm">
                        {hasActiveFilters
                          ? 'ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา ลองปรับหรือล้างตัวกรอง'
                          : 'ยังไม่มีการบันทึกวันหยุดหรือเวรพิเศษในระบบ'}
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="mt-2"
                        onClick={onOpenCreateModal}
                      >
                        + บันทึกวันหยุด / เวรพิเศษ
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOverrides.map((item) => {
                  const doc = item.doctor;
                  const isOff = !item.is_available;

                  return (
                    <tr key={item.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      {/* Column 1: Date */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-[var(--fg)]">
                            {formatDate(item.override_date)}
                          </span>
                          <span className="text-[11px] text-[var(--muted)] font-mono">
                            {item.override_date}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Doctor */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {doc?.first_name.slice(0, 1) || item.doctor_first_name?.slice(0, 1) || 'D'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-[var(--fg)]">
                              {doc?.title || item.doctor_title || ''} {doc?.first_name || item.doctor_first_name} {doc?.last_name || item.doctor_last_name}
                            </span>
                            <span className="text-[11px] text-[var(--muted)]">
                              {item.departmentName || doc?.department_name || 'แผนกผู้ป่วยนอก'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Type Badge */}
                      <td className="py-3.5 px-4 align-middle">
                        {isOff ? (
                          <Badge variant="rose" size="sm" dot>
                            🏖️ ลาหยุด (Off)
                          </Badge>
                        ) : (
                          <Badge variant="teal" size="sm" dot>
                            ⏰ เวรพิเศษ (Extra Shift)
                          </Badge>
                        )}
                      </td>

                      {/* Column 4: Time Range */}
                      <td className="py-3.5 px-4 align-middle">
                        {isOff ? (
                          <span className="text-xs text-[var(--muted)]">หยุดตรวจตลอดทั้งวัน</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300">
                              {formatTime(item.start_time)} - {formatTime(item.end_time)} น.
                            </span>
                            {item.break_start && item.break_end && (
                              <span className="text-[10px] text-[var(--muted)] font-mono">
                                พัก: {formatTime(item.break_start)} - {formatTime(item.break_end)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Reason */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="text-xs text-[var(--fg-secondary)] max-w-xs truncate block" title={item.reason || ''}>
                          {item.reason || '-'}
                        </span>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => onEditOverride(item)}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-rose-600 hover:bg-rose-500/10"
                            onClick={() => setOverrideToDelete(item)}
                          >
                            ลบ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!overrideToDelete}
        title="ยืนยันการลบรายการข้อยกเว้นตารางตรวจ"
        message={
          overrideToDelete
            ? `ต้องการลบรายการ "${overrideToDelete.is_available ? 'เวรพิเศษ' : 'วันหยุด'}" ของ ${overrideToDelete.doctor_title || ''} ${overrideToDelete.doctor_first_name} ${overrideToDelete.doctor_last_name} ในวันที่ ${formatDate(overrideToDelete.override_date)} ใช่หรือไม่?`
            : ''
        }
        subMessage="เมื่อลบรายการนี้แล้ว ระบบจะคืนสิทธิ์และกลับไปใช้ตารางเวลาตรวจปกติของแพทย์"
        confirmLabel="ยืนยันลบรายการ"
        variant="danger"
        isLoading={isDeleting}
        onCancel={() => setOverrideToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
