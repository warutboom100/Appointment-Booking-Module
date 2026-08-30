import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/providers/ToastProvider';
import { AppointmentTypeModal } from '@/components/appointment-types/AppointmentTypeModal';
import type { AppointmentType } from '@/types';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('AppointmentTypeModal Component', () => {
  it('renders create mode with preset durations and color options', () => {
    renderWithProviders(
      <AppointmentTypeModal
        isOpen={true}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('เพิ่มประเภทการนัดหมายใหม่')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/เช่น ตรวจรักษาทั่วไป/i)).toBeInTheDocument();
    expect(screen.getByText('15m')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('60m')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /สร้างประเภทการตรวจ/i })).toBeInTheDocument();
  });

  it('renders edit mode with prefilled appointment type details', () => {
    const mockType: AppointmentType = {
      id: 'type-123',
      name: 'ตรวจหัวใจคลื่นไฟฟ้า (EKG)',
      duration_minutes: 45,
      color: '#4F46E5',
      description: 'ตรวจคลื่นไฟฟ้าหัวใจและให้คำปรึกษา',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    renderWithProviders(
      <AppointmentTypeModal
        isOpen={true}
        onClose={() => {}}
        typeToEdit={mockType}
      />,
    );

    expect(screen.getByText('แก้ไขประเภทการนัดหมาย')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ตรวจหัวใจคลื่นไฟฟ้า (EKG)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#4F46E5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /บันทึกการแก้ไข/i })).toBeInTheDocument();
  });
});
