import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingModal } from '@/components/appointments/BookingModal';
import { ToastProvider } from '@/providers/ToastProvider';

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

describe('BookingModal Component', () => {
  it('does not render when isOpen is false', () => {
    renderWithProviders(
      <BookingModal isOpen={false} onClose={() => {}} />,
    );
    expect(screen.queryByText(/จองคิวนัดหมายแพทย์/i)).not.toBeInTheDocument();
  });

  it('renders 4-step wizard header when isOpen is true', () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <BookingModal isOpen={true} onClose={handleClose} />,
    );

    expect(screen.getByText(/จองคิวนัดหมายแพทย์/i)).toBeInTheDocument();
    expect(screen.getByText(/เลือกผู้ป่วย/i)).toBeInTheDocument();
    expect(screen.getByText(/แพทย์ & แผนก/i)).toBeInTheDocument();
    expect(screen.getByText(/วัน & เวลาตรวจ/i)).toBeInTheDocument();
    expect(screen.getByText(/สรุปและยืนยัน/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /ยกเลิก/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
