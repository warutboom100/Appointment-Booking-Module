import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StepSlotPicker } from '@/components/appointments/StepSlotPicker';
import type { Doctor, AppointmentType } from '@/types';

// Mock doctor schedules and slots
vi.mock('@/hooks/useSchedules', () => ({
  useDoctorSchedules: () => ({
    data: [
      {
        id: 'sch-1',
        doctor_id: 'doc-1',
        day_of_week: 1, // Monday
        start_time: '09:00:00',
        end_time: '16:00:00',
        is_available: true,
      },
      {
        id: 'sch-2',
        doctor_id: 'doc-1',
        day_of_week: 3, // Wednesday
        start_time: '09:00:00',
        end_time: '16:00:00',
        is_available: true,
      },
    ],
    isLoading: false,
  }),
  useDoctorOverrides: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAppointments', () => ({
  useAvailableSlots: () => ({
    data: {
      slots: [
        { start_time: '09:00:00', end_time: '09:30:00', is_available: true },
        { start_time: '09:30:00', end_time: '10:00:00', is_available: true },
        { start_time: '13:00:00', end_time: '13:30:00', is_available: true },
      ],
    },
    isLoading: false,
  }),
}));

const mockDoctor: Doctor = {
  id: 'doc-1',
  title: 'นพ.',
  first_name: 'สมชาย',
  last_name: 'ใจดี',
  department_id: 'dept-1',
  department_name: 'แผนกอายุรกรรม',
  is_active: true,
  created_at: '2026-08-30T00:00:00Z',
  updated_at: '2026-08-30T00:00:00Z',
};

const mockType: AppointmentType = {
  id: 'type-1',
  name: 'ตรวจรักษาทั่วไป',
  duration_minutes: 30,
  is_active: true,
  created_at: '2026-08-30T00:00:00Z',
  updated_at: '2026-08-30T00:00:00Z',
};

function renderComponent(props: Partial<React.ComponentProps<typeof StepSlotPicker>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StepSlotPicker
        doctor={mockDoctor}
        appointmentType={mockType}
        selectedDate="2026-08-31"
        selectedSlot={null}
        onSelectDate={vi.fn()}
        onSelectSlot={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe('StepSlotPicker Component', () => {
  it('renders doctor info, schedule summary, and available date selector', () => {
    renderComponent();

    // Doctor & Schedule header
    expect(screen.getByText(/นพ. สมชาย ใจดี/i)).toBeInTheDocument();
    expect(screen.getByText(/ตารางออกตรวจประจำ:/i)).toBeInTheDocument();
    expect(screen.getByText(/เลือกจากวันที่แพทย์ลงตรวจจริง/i)).toBeInTheDocument();

    // Time Slots
    expect(screen.getByText(/ช่วงเวลาที่แพทย์ว่าง/i)).toBeInTheDocument();
    expect(screen.getByText(/09:00 - 09:30 น./i)).toBeInTheDocument();
    expect(screen.getByText(/13:00 - 13:30 น./i)).toBeInTheDocument();
  });

  it('triggers onSelectSlot when a time slot is clicked', () => {
    const handleSelectSlot = vi.fn();
    renderComponent({ onSelectSlot: handleSelectSlot });

    const slotBtn = screen.getByRole('button', { name: /09:00 - 09:30 น./i });
    fireEvent.click(slotBtn);

    expect(handleSelectSlot).toHaveBeenCalledWith({
      start_time: '09:00:00',
      end_time: '09:30:00',
      is_available: true,
    });
  });
});
