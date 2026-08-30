'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePatients } from '@/hooks/usePatients';
import { PatientQuickAddModal } from '@/components/patients/PatientQuickAddModal';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, calculateAge, genderLabel, formatPhone } from '@/lib/format';
import type { Patient } from '@/types';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 350);

  const { data, isLoading } = usePatients({
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  const patients = data?.data || [];
  const meta = data?.meta;

  const columns: Column<Patient>[] = [
    {
      key: 'hn',
      header: 'เลขประจำตัว (HN)',
      render: (p) => (
        <Link href={`/patients/${p.id}`} className="no-underline">
          <Badge variant="teal" size="md" className="font-mono hover:underline cursor-pointer">
            {p.hn}
          </Badge>
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'ชื่อ-นามสกุล',
      render: (p) => {
        const age = calculateAge(p.date_of_birth);
        return (
          <div className="flex flex-col">
            <Link
              href={`/patients/${p.id}`}
              className="text-sm font-semibold text-[var(--fg)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              {p.first_name} {p.last_name}
            </Link>
            <span className="text-xs text-[var(--muted)]">
              {genderLabel(p.gender)} {age !== null ? `• อายุ ${age} ปี` : ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'เบอร์ติดต่อ',
      render: (p) => (
        <span className="text-xs text-[var(--fg)] font-mono">
          {formatPhone(p.phone)}
        </span>
      ),
    },
    {
      key: 'allergies',
      header: 'ประวัติแพ้ยา',
      render: (p) => {
        if (!p.allergies) {
          return <span className="text-xs text-[var(--muted)]">-</span>;
        }
        return (
          <Badge variant="rose" size="sm" dot className="max-w-[200px] truncate">
            {p.allergies}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      header: 'วันที่ลงทะเบียน',
      render: (p) => (
        <span className="text-xs text-[var(--muted)]">
          {formatDate(p.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/patients/${p.id}`}>
            <Button variant="outline" size="sm">
              ดูประวัติ ➔
            </Button>
          </Link>
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
            เวชระเบียนผู้ป่วย (Patients Directory)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            ค้นหา ตรวจสอบข้อมูลประวัติการรักษา และลงทะเบียนผู้ป่วยใหม่
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsQuickAddOpen(true)}
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
          ลงทะเบียนคนไข้ใหม่
        </Button>
      </div>

      {/* Search & Filter Card */}
      <Card variant="glass" className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="ค้นหาด้วยเลข HN, ชื่อ-นามสกุล, หรือเบอร์โทรศัพท์..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
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
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
            >
              ล้างคำค้น
            </Button>
          )}
        </div>
      </Card>

      {/* Patient Table */}
      <div className="flex flex-col gap-4">
        <Table
          columns={columns}
          data={patients}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyMessage={
            searchTerm
              ? `ไม่พบผู้ป่วยที่ตรงกับคำค้น "${searchTerm}"`
              : 'ยังไม่มีข้อมูลผู้ป่วยในระบบ'
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

      {/* Quick Add Modal */}
      <PatientQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
}
