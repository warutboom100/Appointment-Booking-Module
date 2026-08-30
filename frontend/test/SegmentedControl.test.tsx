import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

describe('SegmentedControl Component', () => {
  const options = [
    { value: 'all', label: 'ทั้งหมด', count: 12 },
    { value: 'today', label: 'วันนี้', count: 4 },
    { value: 'upcoming', label: 'ที่กำลังจะมาถึง' },
  ];

  it('renders all options and shows active selection', () => {
    render(<SegmentedControl options={options} value="all" onChange={() => {}} />);
    expect(screen.getByText('ทั้งหมด')).toBeInTheDocument();
    expect(screen.getByText('วันนี้')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('calls onChange with new value when clicking an unselected tab', () => {
    const handleChange = vi.fn();
    render(<SegmentedControl options={options} value="all" onChange={handleChange} />);
    fireEvent.click(screen.getByText('วันนี้'));
    expect(handleChange).toHaveBeenCalledWith('today');
  });
});
