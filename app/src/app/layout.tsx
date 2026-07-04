import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Sus Score — Dark Pattern Detector',
  description: 'Scan any website or email for dark patterns. Get a Sus Score, visual overlays, and auto-generated fix reports.',
  keywords: ['dark patterns', 'sus score', 'UX ethics', 'accessibility', 'web scanner', 'deceptive design'],
  openGraph: {
    title: 'Sus Score — Dark Pattern Detector',
    description: 'Expose manipulative dark patterns on any website. Get a Sus Score.',
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
