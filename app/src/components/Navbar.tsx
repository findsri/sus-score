'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Shield, Trophy, Clock, Mail, Puzzle } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Scanner', icon: Shield },
  { href: '/leaderboard', label: 'Hall of Shame', icon: Trophy },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/email', label: 'Email Scanner', icon: Mail },
  { href: '/extension', label: 'Extension', icon: Puzzle },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center group-hover:bg-accent/80 transition-colors">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm hidden sm:block">
            <span className="gradient-text">Sus</span>
            <span className="text-text-primary"> Score</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                pathname === href
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:block">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
