'use client';

import { useAuthStore } from '@/features/auth/auth.store';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col gap-6 stagger">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ระบบบริการผู้ป่วยนอก (OPD Appointment System)
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            สวัสดี, {user?.name || 'ผู้ใช้งาน'} 👋
          </h2>
          <p className="text-teal-100/90 text-sm sm:text-base leading-relaxed">
            ยินดีต้อนรับสู่ระบบบริหารจัดการคิวนัดหมายและตารางออกตรวจแพทย์
            คุณสามารถค้นหาผู้ป่วย จองคิวตรวจ หรือตรวจสอบสถิติประจำวันได้จากแผงควบคุมนี้
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link href="/patients">
              <Button
                variant="secondary"
                size="md"
                className="bg-white/95 text-teal-900 hover:bg-white border-none shadow-sm"
              >
                🔍 ค้นหาผู้ป่วย / เวชระเบียน
              </Button>
            </Link>
            <Link href="/appointments">
              <Button
                variant="outline"
                size="md"
                className="text-white border-white/30 hover:bg-white/10"
              >
                📅 ดูรายการนัดหมายทั้งหมด
              </Button>
            </Link>
          </div>
        </div>

        {/* Apple subtle geometric glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">นัดหมายวันนี้</span>
            <Badge variant="teal" size="sm">Today</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">18</span>
            <span className="text-xs text-[var(--muted)]">คิว</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-medium">
            <span>↑ 4 รายการ</span>
            <span className="text-[var(--muted)] font-normal">จากช่วงเช้า</span>
          </p>
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">ผู้ป่วยมาถึงแล้ว</span>
            <Badge variant="amber" size="sm">Checked-in</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">6</span>
            <span className="text-xs text-[var(--muted)]">คนรอตรวจ</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">
            เฉลี่ยเวลารอ 12 นาที
          </p>
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">ตรวจเสร็จสิ้น</span>
            <Badge variant="emerald" size="sm">Completed</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">9</span>
            <span className="text-xs text-[var(--muted)]">เสร็จแล้ว</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">
            50% ของคิววันนี้
          </p>
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">แพทย์ออกตรวจ</span>
            <Badge variant="indigo" size="sm">Doctors</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">5</span>
            <span className="text-xs text-[var(--muted)]">ท่าน</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">
            ครอบคลุม 4 แผนก
          </p>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader
            title="เวชระเบียนและประวัติคนไข้"
            subtitle="ระบบค้นหาผู้ป่วยด้วย HN, ชื่อ หรือเบอร์โทรศัพท์ พร้อมประวัติการนัดหมาย"
            action={
              <Link href="/patients">
                <Button variant="secondary" size="sm">ไปที่หน้ารายชื่อผู้ป่วย ➔</Button>
              </Link>
            }
          />
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            รองรับการลงทะเบียนผู้ป่วยใหม่ (Quick Add) และระบบสร้างเลขประจำตัวผู้ป่วย (HN) อัตโนมัติ สามารถดูประวัติการนัดหมายย้อนหลังของคนไข้ได้ทันที
          </p>
        </Card>

        <Card variant="default">
          <CardHeader
            title="ปฏิทินตารางออกตรวจแพทย์"
            subtitle="มุมมองตารางออกตรวจรายเดือนและรายสัปดาห์ของแพทย์ทุกท่าน"
            action={
              <Link href="/schedules">
                <Button variant="secondary" size="sm">ดูปฏิทินตารางตรวจ ➔</Button>
              </Link>
            }
          />
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            ตรวจสอบช่วงเวลาตรวจของแพทย์แต่ละแผนก พร้อมระบุวันหยุดแพทย์ (Leave Overrides) เพื่อป้องกันการจองคิวซ้อนทับหรือจองในวันหยุด
          </p>
        </Card>
      </div>
    </div>
  );
}
