import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '@/providers/ToastProvider';
import { OverridesListTable } from '@/components/schedules/OverridesListTable';
import type { Doctor, Department, ScheduleOverride } from '@/types';

const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    title: 'นพ.',
    first_name: 'สมชาย',
    last_name: 'ใจดี',
    department_id: 'dept-1',
    is_active: true,
    created_at: '2026-08-30T00:00:00Z',
    updated_at: '2026-08-30T00:00:00Z',
  },
];

const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    name: 'แผนกอายุรกรรม',
    is_active: true,
    created_at: '2026-08-30T00:00:00Z',
    updated_at: '2026-08-30T00:00:00Z',
  },
];

const mockOverrides: Record<string, ScheduleOverride[]> = {
  'doc-1': [
    {
      id: 'ov-1',
      doctor_id: 'doc-1',
      override_date: '2026-09-05',
      is_available: false,
      reason: 'ลาพักร้อนประจำปี',
      created_at: '2026-08-30T00:00:00Z',
      updated_at: '2026-08-30T00:00:00Z',
    },
    {
      id: 'ov-2',
      doctor_id: 'doc-1',
      override_date: '2026-09-10',
      is_available: true,
      start_time: '17:00:00',
      end_time: '20:00:00',
      reason: 'เวรตรวจคลินิกพิเศษนอกเวลา',
      created_at: '2026-08-30T00:00:00Z',
      updated_at: '2026-08-30T00:00:00Z',
    },
  ],
};

function renderComponent(props: Partial<React.ComponentProps<typeof OverridesListTable>> = {}) {
  return render(
    <ToastProvider>
      <OverridesListTable
        doctors={mockDoctors}
        departments={mockDepartments}
        allOverrides={mockOverrides}
        onEditOverride={vi.fn()}
        onSuccess={vi.fn()}
        onOpenCreateModal={vi.fn()}
        {...props}
      />
    </ToastProvider>,
  );
}

describe('OverridesListTable', () => {
  it('renders summary count cards and table rows', () => {
    renderComponent();

    expect(screen.getByText(/ข้อยกเว้นตารางตรวจทั้งหมด/i)).toBeInTheDocument();
    expect(screen.getByText(/วันหยุดแพทย์ \(Leaves\/Off\)/i)).toBeInTheDocument();
    expect(screen.getByText(/เวรตรวจพิเศษ \(Extra Shifts\)/i)).toBeInTheDocument();

    // Check rows
    expect(screen.getByText(/ลาพักร้อนประจำปี/i)).toBeInTheDocument();
    expect(screen.getByText(/เวรตรวจคลินิกพิเศษนอกเวลา/i)).toBeInTheDocument();
    expect(screen.getAllByText(/🏖️ ลาหยุด \(Off\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/⏰ เวรพิเศษ \(Extra Shift\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('triggers delete confirmation dialog on delete button click', () => {
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /ลบ/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);

    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/ยืนยันการลบรายการข้อยกเว้นตารางตรวจ/i)).toBeInTheDocument();
    expect(screen.getByText(/เมื่อลบรายการนี้แล้ว ระบบจะคืนสิทธิ์และกลับไปใช้ตารางเวลาตรวจปกติของแพทย์/i)).toBeInTheDocument();
  });
});
