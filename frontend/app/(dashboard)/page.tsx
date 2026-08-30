'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { formatTime, getAppointmentStatusMeta } from '@/lib/format';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: summary, isLoading } = useDashboardSummary();

  const todayQueue = summary?.today_queue || [];

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
        {/* Total Appointments Today */}
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">นัดหมายวันนี้</span>
            <Badge variant="teal" size="sm">Today</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">
              {isLoading ? '...' : summary?.total_appointments ?? 0}
            </span>
            <span className="text-xs text-[var(--muted)]">คิว</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">
            {summary?.status_breakdown
              ? `รอยืนยัน/จองแล้ว ${summary.status_breakdown.booked + summary.status_breakdown.confirmed} คิว`
              : 'กำลังโหลดข้อมูล...'}
          </p>
        </Card>

        {/* Patients Arrived / Waiting */}
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">ผู้ป่วยมาถึงแล้ว</span>
            <Badge variant="amber" size="sm">Checked-in</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">
              {isLoading ? '...' : summary?.status_breakdown?.checked_in ?? 0}
            </span>
            <span className="text-xs text-[var(--muted)]">คนรอตรวจ</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
            {summary?.status_breakdown?.in_progress
              ? `กำลังตรวจอยู่ ${summary.status_breakdown.in_progress} คน`
              : 'พร้อมเข้าห้องตรวจ'}
          </p>
        </Card>

        {/* Completed Visits */}
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">ตรวจเสร็จสิ้น</span>
            <Badge variant="emerald" size="sm">Completed</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">
              {isLoading ? '...' : summary?.status_breakdown?.completed ?? 0}
            </span>
            <span className="text-xs text-[var(--muted)]">เสร็จแล้ว</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            {summary?.total_appointments && summary.total_appointments > 0
              ? `${Math.round(((summary.status_breakdown?.completed || 0) / summary.total_appointments) * 100)}% ของคิวทั้งหมด`
              : '0% สำเร็จ'}
          </p>
        </Card>

        {/* Doctors On Duty */}
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">แพทย์ออกตรวจวันนี้</span>
            <Badge variant="indigo" size="sm">Doctors</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">
              {isLoading ? '...' : summary?.doctors_on_duty_count ?? 0}
            </span>
            <span className="text-xs text-[var(--muted)]">ท่าน</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">
            ตามตารางเวรและข้อยกเว้นวันนี้
          </p>
        </Card>
      </div>

      {/* Today's Live Queue Table */}
      <Card variant="default">
        <CardHeader
          title="คิวตรวจวันนี้ (Today's Live Queue)"
          subtitle={summary?.date ? `รายการนัดหมายประจำวันที่ ${summary.date}` : 'รายการนัดหมายทั้งหมดในวันนี้'}
          action={
            <Link href="/appointments">
              <Button variant="secondary" size="sm">
                จัดการนัดหมายทั้งหมด ➔
              </Button>
            </Link>
          }
        />

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[var(--muted)] text-sm">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
            กำลังโหลดคิวตรวจวันนี้...
          </div>
        ) : todayQueue.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[var(--muted)] text-sm">
            <span className="text-3xl mb-2">🏖️</span>
            <span>ไม่มีรายการนัดหมายในวันนี้</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] text-xs uppercase border-y border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3 px-4">เวลาตรวจ</th>
                  <th className="py-3 px-4">ผู้ป่วย</th>
                  <th className="py-3 px-4">แพทย์ผู้ตรวจ</th>
                  <th className="py-3 px-4">แผนก / ประเภทตรวจ</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {todayQueue.slice(0, 10).map((item) => {
                  const statusMeta = getAppointmentStatusMeta(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[var(--fg)] font-mono text-xs">
                        {formatTime(item.start_time)} - {formatTime(item.end_time)} น.
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-[var(--fg)]">{item.patient_name}</div>
                        <div className="text-[11px] text-[var(--muted)] font-mono">HN: {item.patient_hn}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-[var(--fg)]">
                        {item.doctor_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[var(--fg)] font-semibold text-xs">{item.department_name}</div>
                        <div className="text-[11px] text-[var(--muted)]">{item.appointment_type_name}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={statusMeta.variant} size="sm" dot>
                          {statusMeta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
