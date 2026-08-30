import type { Metadata } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';

// IBM Plex — สายพันธุ์ industrial, รองรับไทย+ละติน ในไฟล์เดียว
const plexThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบนัดหมายแพทย์ — Hospital Appointment Booking',
  description: 'ระบบบริหารจัดการคิวนัดหมายแพทย์และตารางตรวจผู้ป่วยนอก',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning className={plexThai.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('hospital_theme') || 'light';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
