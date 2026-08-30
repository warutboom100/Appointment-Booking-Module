import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="หัวข้อ Modal">
        เนื้อหา Modal
      </Modal>,
    );
    expect(screen.queryByText('หัวข้อ Modal')).not.toBeInTheDocument();
  });

  it('renders title, content, and calls onClose when clicking close button', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="หน้าต่างยืนยัน">
        เนื้อหาสำคัญ
      </Modal>,
    );
    expect(screen.getByText('หน้าต่างยืนยัน')).toBeInTheDocument();
    expect(screen.getByText('เนื้อหาสำคัญ')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /ปิดหน้าต่าง/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
