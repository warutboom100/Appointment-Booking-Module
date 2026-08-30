import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CancelAppointmentModal } from '@/components/appointments/CancelAppointmentModal';
import { ToastProvider } from '@/providers/ToastProvider';
import type { Appointment } from '@/types';

const mockAppointment: Appointment = {
  id: 'app-123',
  patient_id: 'pat-1',
  doctor_id: 'doc-1',
  department_id: 'dept-1',
  appointment_type_id: 'type-1',
  appointment_date: '2026-09-01',
  start_time: '09:00:00',
  end_time: '09:30:00',
  status: 'booked',
  created_at: '2026-08-30T00:00:00Z',
  updated_at: '2026-08-30T00:00:00Z',
  patient: {
    id: 'pat-1',
    hn: 'HN20260101-001',
    first_name: 'สมศรี',
    last_name: 'สุขใจ',
    date_of_birth: '1990-01-01',
    gender: 'female',
    is_active: true,
    created_at: '2026-08-30T00:00:00Z',
    updated_at: '2026-08-30T00:00:00Z',
  },
  doctor: {
    id: 'doc-1',
    title: 'นพ.',
    first_name: 'สมชาย',
    last_name: 'ใจดี',
    department_id: 'dept-1',
    is_active: true,
    created_at: '2026-08-30T00:00:00Z',
    updated_at: '2026-08-30T00:00:00Z',
  },
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('CancelAppointmentModal', () => {
  it('does not render when isOpen is false', () => {
    renderWithProviders(
      <CancelAppointmentModal
        isOpen={false}
        onClose={() => {}}
        appointment={mockAppointment}
      />,
    );
    expect(screen.queryByText(/ยืนยันการยกเลิกนัดหมาย/i)).not.toBeInTheDocument();
  });

  it('renders patient and doctor details when open', () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <CancelAppointmentModal
        isOpen={true}
        onClose={handleClose}
        appointment={mockAppointment}
      />,
    );

    expect(screen.getByText(/ยืนยันการยกเลิกนัดหมาย/i)).toBeInTheDocument();
    expect(screen.getByText(/สมศรี สุขใจ/i)).toBeInTheDocument();
    expect(screen.getByText(/สมชาย ใจดี/i)).toBeInTheDocument();

    const quickChip = screen.getByRole('button', { name: /คนไข้ติดธุระด่วน/i });
    fireEvent.click(quickChip);

    const textarea = screen.getByPlaceholderText(/พิมพ์เหตุผลที่ต้องยกเลิกนัดหมาย/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('คนไข้ติดธุระด่วน');
  });
});
