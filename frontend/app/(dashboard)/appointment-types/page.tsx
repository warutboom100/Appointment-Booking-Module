'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import { Pagination } from '@/components/Pagination';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { AppointmentTypeModal } from '@/components/appointment-types/AppointmentTypeModal';
import { useAppointmentTypes, useDeleteAppointmentType } from '@/hooks/useAppointmentTypes';
import { useToast } from '@/providers/ToastProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/api/client';
import type { AppointmentType } from '@/types';

export default function AppointmentTypesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const debouncedSearch = useDebounce(search, 350);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeToEdit, setTypeToEdit] = useState<AppointmentType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<AppointmentType | null>(null);

  const { addToast } = useToast();
  const deleteMutation = useDeleteAppointmentType();

  const { data, isLoading } = useAppointmentTypes({
    search: debouncedSearch || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    page,
    limit: 10,
  });

  const appointmentTypes = data?.data || [];
  const meta = data?.meta;

  const handleEdit = (item: AppointmentType) => {
    setTypeToEdit(item);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    try {
      await deleteMutation.mutateAsync(typeToDelete.id);
      addToast({
        type: 'success',
        title: 'ปิดใช้งานประเภทการตรวจสำเร็จ',
        description: `เปลี่ยนสถานะ "${typeToDelete.name}" เป็นปิดใช้งานเรียบร้อยแล้ว`,
      });
      setTypeToDelete(null);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        description: getErrorMessage(error),
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTypeToEdit(null);
  };

  const columns: Column<AppointmentType>[] = [
    {
      key: 'name',
      header: 'ชื่อประเภทการตรวจ',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--fg)]">{item.name}</span>
          {item.description && (
            <span className="text-xs text-[var(--muted)] truncate max-w-xs" title={item.description}>
              {item.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'color',
      header: 'สีตัวอย่าง (Tag)',
      render: (item) => {
        const itemColor = item.color || item.color_code || '#0D9488';
        return (
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: itemColor }}
            />
            <span
              className="px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white shadow-2xs"
              style={{ backgroundColor: itemColor }}
            >
              {item.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'duration',
      header: 'ระยะเวลาตรวจ',
      render: (item) => (
        <Badge variant="blue" size="sm" className="font-mono">
          ⏱️ {item.duration_minutes} นาที
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (item) => (
        <Badge variant={item.is_active ? 'emerald' : 'neutral'} size="sm">
          {item.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
            แก้ไข
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--danger)] hover:bg-red-500/10"
            onClick={() => setTypeToDelete(item)}
            disabled={deleteMutation.isPending}
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
            ประเภทการนัดหมาย (Appointment Types)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            จัดการประเภทบริการตรวจ ระยะเวลาการเข้าพบแพทย์ และรหัสสีสำหรับจัดสรรเวลา
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setTypeToEdit(null);
            setIsModalOpen(true);
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
          เพิ่มประเภทการตรวจ
        </Button>
      </div>

      {/* Search & Filter Card */}
      <Card variant="glass" className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="ค้นหาชื่อประเภทการตรวจ หรือรายละเอียด..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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

      {/* Table */}
      <div className="flex flex-col gap-4">
        <Table
          columns={columns}
          data={appointmentTypes}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage={
            search || statusFilter !== 'all'
              ? 'ไม่พบประเภทการตรวจที่ตรงกับเงื่อนไขการค้นหา'
              : 'ยังไม่มีข้อมูลประเภทการตรวจในระบบ เริ่มต้นสร้างประเภทใหม่'
          }
        />

        {meta && meta.totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              meta={meta}
              onPageChange={(p) => setPage(p)}
              onLimitChange={() => {}}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <AppointmentTypeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        typeToEdit={typeToEdit}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!typeToDelete}
        title="ยืนยันการปิดใช้งานประเภทการตรวจ"
        message={
          <span>
            คุณต้องการปิดใช้งานประเภทการตรวจ{' '}
            <strong className="text-[var(--fg)]">{typeToDelete?.name}</strong> ใช่หรือไม่?
          </span>
        }
        subMessage="ระบบจะเปลี่ยนสถานะเป็น 'ปิดใช้งาน' และจะไม่สามารถนำไปเลือกจองคิวนัดหมายใหม่ได้"
        confirmLabel="ปิดใช้งานประเภทนี้"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTypeToDelete(null)}
      />
    </div>
  );
}
