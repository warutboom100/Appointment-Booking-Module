import type { AppointmentStatus } from '@/types';
import { Badge, type BadgeVariant } from './Badge';

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

const STATUS_CONFIGS: Record<AppointmentStatus, StatusConfig> = {
  booked: {
    label: 'จองแล้ว (Booked)',
    variant: 'blue',
  },
  confirmed: {
    label: 'ยืนยันแล้ว (Confirmed)',
    variant: 'indigo',
  },
  checked_in: {
    label: 'มาถึงแล้ว (Checked-in)',
    variant: 'amber',
  },
  in_progress: {
    label: 'กำลังตรวจ (In Progress)',
    variant: 'purple',
  },
  completed: {
    label: 'เสร็จสิ้น (Completed)',
    variant: 'emerald',
  },
  cancelled: {
    label: 'ยกเลิก (Cancelled)',
    variant: 'rose',
  },
  rescheduled: {
    label: 'เลื่อนนัด (Rescheduled)',
    variant: 'neutral',
  },
};

export interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] ?? {
    label: status,
    variant: 'neutral',
  };

  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {config.label}
    </Badge>
  );
}
