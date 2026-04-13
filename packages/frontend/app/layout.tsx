import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'MediaLink Ghana — Media Sales Recruitment Platform',
    template: '%s | MediaLink Ghana',
  },
  description: 'Connect with top media sales talent across Ghana. The #1 recruitment platform for TV, radio, digital, print and outdoor media companies.',
  keywords: ['media sales jobs Ghana', 'sales recruitment Ghana', 'media house jobs', 'TV radio jobs Ghana'],
  openGraph: {
    title: 'MediaLink Ghana',
    description: 'The #1 media sales recruitment platform in Ghana.',
    locale: 'en_GH',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <a href="#main-content" className="skip-to-content">Skip to main content</a>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
