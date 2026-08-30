'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import { Pagination } from '@/components/Pagination';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useDepartments, useDeleteDepartment } from '@/hooks/useDepartments';
import { DepartmentModal } from '@/components/departments/DepartmentModal';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { useDebounce } from '@/hooks/useDebounce';
import type { Department } from '@/types';

export default function DepartmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const debouncedSearch = useDebounce(search, 350);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  const { addToast } = useToast();
  const deleteDepartment = useDeleteDepartment();

  const { data, isLoading } = useDepartments({
    search: debouncedSearch || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    page,
    limit: 10,
  });

  const departments = data?.data || [];
  const meta = data?.meta;

  const handleEdit = (dept: Department) => {
    setDeptToEdit(dept);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      await deleteDepartment.mutateAsync(deptToDelete.id);
      addToast({ type: 'success', title: 'ลบแผนกสำเร็จ' });
      setDeptToDelete(null);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDeptToEdit(null);
  };

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'ชื่อแผนก',
      render: (dept) => (
        <span className="text-sm font-semibold text-[var(--fg)]">{dept.name}</span>
      ),
    },
    {
      key: 'location',
      header: 'สถานที่/อาคาร',
      render: (dept) => (
        <span className="text-xs text-[var(--fg)] font-mono">
          {dept.location || '-'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'รายละเอียด',
      render: (dept) => (
        <div className="max-w-xs truncate text-xs text-[var(--muted)]" title={dept.description || ''}>
          {dept.description || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (dept) => (
        <Badge variant={dept.is_active ? 'emerald' : 'neutral'} size="sm">
          {dept.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (dept) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
            แก้ไข
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--danger)] hover:bg-red-500/10"
            onClick={() => setDeptToDelete(dept)}
            disabled={deleteDepartment.isPending}
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
            ข้อมูลแผนก (Departments Directory)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            จัดการข้อมูลแผนก สถานที่ตั้ง และสถานะการเปิดให้บริการในโรงพยาบาล
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setDeptToEdit(null);
            setIsModalOpen(true);
          }}
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          เพิ่มแผนกใหม่
        </Button>
      </div>

      {/* Search & Filter Card */}
      <Card variant="glass" className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="ค้นหาชื่อแผนก หรือสถานที่..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
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

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SegmentedControl
              options={[
                { label: 'ทั้งหมด', value: 'all' },
                { label: 'ใช้งานอยู่', value: 'active' },
                { label: 'ปิดใช้งาน', value: 'inactive' },
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
            />
            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPage(1);
                }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Department Table */}
      <div className="flex flex-col gap-4">
        <Table
          columns={columns}
          data={departments}
          keyExtractor={(dept) => dept.id}
          isLoading={isLoading}
          emptyMessage={
            (search || statusFilter !== 'all')
              ? 'ไม่พบแผนกที่ตรงกับเงื่อนไขการค้นหา'
              : 'ยังไม่มีข้อมูลแผนกในระบบ เริ่มต้นโดยการเพิ่มแผนกใหม่'
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

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        departmentToEdit={deptToEdit}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deptToDelete}
        title="ยืนยันการลบแผนก"
        message={
          <span>
            คุณต้องการลบแผนก <strong className="text-[var(--fg)]">{deptToDelete?.name}</strong> ใช่หรือไม่?
          </span>
        }
        subMessage="การลบอาจทำไม่ได้หากมีแพทย์หรือประวัติการนัดหมายผูกอยู่กับแผนกนี้ แนะนำให้เปลี่ยนสถานะเป็น 'ปิดใช้งาน' แทน"
        confirmLabel="ลบแผนก"
        isLoading={deleteDepartment.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeptToDelete(null)}
      />
    </div>
  );
}
