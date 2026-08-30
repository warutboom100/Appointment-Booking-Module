import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="ยืนยันการลบ"
        message="คุณต้องการลบหรือไม่"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByText('ยืนยันการลบ')).not.toBeInTheDocument();
  });

  it('renders title, message, and calls onConfirm and onCancel properly', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="ยืนยันการลบข้อมูลแพทย์"
        message="ต้องการลบ นพ. สมชาย หรือไม่?"
        confirmLabel="ลบแพทย์"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    );

    expect(screen.getByText('ยืนยันการลบข้อมูลแพทย์')).toBeInTheDocument();
    expect(screen.getByText('ต้องการลบ นพ. สมชาย หรือไม่?')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'ยกเลิก' });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole('button', { name: 'ลบแพทย์' });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
