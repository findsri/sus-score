import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Dark Pattern Detector — Expose Manipulative UX',
  description: 'Scan any website or email for dark patterns. Get an Evil Score, visual overlays, and auto-generated reports.',
  keywords: ['dark patterns', 'UX ethics', 'accessibility', 'web scanner', 'deceptive design'],
  openGraph: {
    title: 'Dark Pattern Detector',
    description: 'Expose manipulative UX dark patterns on any website',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-text-primary">
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
