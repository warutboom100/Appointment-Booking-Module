import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../app/(dashboard)/page';

// Mock useDashboardSummary
vi.mock('@/hooks/useDashboard', () => ({
  useDashboardSummary: () => ({
    data: {
      date: '2026-08-30',
      total_appointments: 12,
      status_breakdown: {
        booked: 3,
        confirmed: 2,
        checked_in: 4,
        in_progress: 1,
        completed: 2,
        cancelled: 0,
        no_show: 0,
        rescheduled: 0,
      },
      doctors_on_duty_count: 5,
      today_queue: [
        {
          id: 'app-1',
          patient_hn: 'HN20260101-001',
          patient_name: 'สมใจ รักษาดี',
          patient_phone: '081-234-5678',
          doctor_name: 'นพ. สมชาย ใจดี',
          department_name: 'แผนกอายุรกรรม',
          appointment_type_name: 'ตรวจรักษาทั่วไป',
          appointment_type_color: '#4CAF50',
          start_time: '09:00:00',
          end_time: '09:30:00',
          status: 'checked_in',
        },
      ],
    },
    isLoading: false,
  }),
}));

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: { name: 'Admin Staff', role: 'admin' },
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  it('renders summary stat counters and live today queue correctly', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/ระบบบริการผู้ป่วยนอก \(OPD Appointment System\)/i)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // total appointments
    expect(screen.getByText('4')).toBeInTheDocument(); // checked in
    expect(screen.getByText('5')).toBeInTheDocument(); // doctors on duty

    // Table rows
    expect(screen.getByText('สมใจ รักษาดี')).toBeInTheDocument();
    expect(screen.getByText(/HN20260101-001/i)).toBeInTheDocument();
    expect(screen.getByText('นพ. สมชาย ใจดี')).toBeInTheDocument();
    expect(screen.getByText('แผนกอายุรกรรม')).toBeInTheDocument();
  });
});
