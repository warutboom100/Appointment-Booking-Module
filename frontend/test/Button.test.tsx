import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>บันทึกข้อมูล</Button>);
    expect(screen.getByRole('button', { name: /บันทึกข้อมูล/i })).toBeInTheDocument();
  });

  it('handles onClick event when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>คลิกที่นี่</Button>);
    fireEvent.click(screen.getByRole('button', { name: /คลิกที่นี่/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders spinner and disables button when isLoading is true', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        กำลังโหลด
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
