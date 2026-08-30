'use client';

import { useState } from 'react';
import { useDoctors, useDeleteDoctor } from '@/hooks/useDoctors';
import { useDepartments } from '@/hooks/useDepartments';
import { DoctorModal } from '@/components/doctors/DoctorModal';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatPhone } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import type { Doctor } from '@/types';

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 350);
  const { addToast } = useToast();
  const deleteDoctor = useDeleteDoctor();

  const { data: deptResponse } = useDepartments({ limit: 100 });
  const departments = deptResponse?.data || [];

  const { data, isLoading } = useDoctors({
    search: debouncedSearch || undefined,
    department_id: selectedDepartment || undefined,
    page,
    limit: 10,
  });

  const doctors = data?.data || [];
  const meta = data?.meta;

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;
    try {
      await deleteDoctor.mutateAsync(doctorToDelete.id);
      addToast({ type: 'success', title: 'ลบข้อมูลแพทย์สำเร็จ' });
      setDoctorToDelete(null);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'ลบข้อมูลไม่สำเร็จ',
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const columns: Column<Doctor>[] = [
    {
      key: 'name',
      header: 'ชื่อ-นามสกุล',
      render: (d) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--fg)]">
            {d.title || ''} {d.first_name} {d.last_name}
          </span>
          {d.specialization && (
            <span className="text-xs text-[var(--muted)] truncate max-w-[200px]">
              {d.specialization}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'department',
      header: 'แผนก',
      render: (d) => {
        const dept = departments.find((dept) => dept.id === d.department_id);
        return (
          <Badge variant="blue" size="sm">
            {dept?.name || d.department_name || 'ไม่ระบุแผนก'}
          </Badge>
        );
      },
    },
    {
      key: 'license_no',
      header: 'เลขที่ใบประกอบวิชาชีพ',
      render: (d) => (
        <span className="text-xs text-[var(--fg)] font-mono">
          {d.license_no || '-'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'เบอร์ติดต่อ',
      render: (d) => (
        <span className="text-xs text-[var(--fg)] font-mono">
          {d.phone ? formatPhone(d.phone) : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (d) => (
        <Badge variant={d.is_active ? 'emerald' : 'neutral'} size="sm">
          {d.is_active ? 'ปฏิบัติงาน' : 'พักงาน/ลาออก'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(d)}>
            แก้ไข
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--danger)] hover:bg-red-500/10"
            onClick={() => setDoctorToDelete(d)}
            disabled={deleteDoctor.isPending}
          >
            ลบ
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 stagger">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)]">
            จัดการข้อมูลแพทย์ (Doctors Directory)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            ลงทะเบียนแพทย์ใหม่ แก้ไขข้อมูล แผนก และตรวจสอบสถานะการทำงาน
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingDoctor(null);
            setIsModalOpen(true);
          }}
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          เพิ่มแพทย์ใหม่
        </Button>
      </div>

      {/* Search & Filter Card */}
      <Card variant="glass" className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="ค้นหาชื่อ, นามสกุล, เลขที่ใบประกอบวิชาชีพ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'ทุกแผนก' },
                ...departments.map(d => ({ value: d.id, label: d.name }))
              ]}
            />
          </div>
          {(searchTerm || selectedDepartment) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');
                setPage(1);
              }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </Card>

      {/* Doctor Table */}
      <div className="flex flex-col gap-4">
        <Table
          columns={columns}
          data={doctors}
          keyExtractor={(d) => d.id}
          isLoading={isLoading}
          emptyMessage={
            (searchTerm || selectedDepartment)
              ? `ไม่พบแพทย์ที่ตรงกับเงื่อนไขการค้นหา`
              : 'ยังไม่มีข้อมูลแพทย์ในระบบ'
          }
        />

        {meta && meta.totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              meta={meta}
              onPageChange={(p) => setPage(p)}
              onLimitChange={() => { }}
            />
          </div>
        )}
      </div>

      {/* Doctor Modal */}
      <DoctorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctorToEdit={editingDoctor}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!doctorToDelete}
        title="ยืนยันการลบข้อมูลแพทย์"
        message={
          <span>
            คุณต้องการลบข้อมูลแพทย์{' '}
            <strong className="text-[var(--fg)]">
              {doctorToDelete?.title || ''} {doctorToDelete?.first_name} {doctorToDelete?.last_name}
            </strong>{' '}
            ใช่หรือไม่?
          </span>
        }
        subMessage="การลบอาจทำไม่ได้หากมีประวัติการจองคิวนัดหมาย แนะนำให้เปลี่ยนสถานะเป็น 'พักงาน' แทน"
        confirmLabel="ลบข้อมูลแพทย์"
        isLoading={deleteDoctor.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDoctorToDelete(null)}
      />
    </div>
  );
}
