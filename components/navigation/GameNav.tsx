'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EmberRootMark } from '@/components/brand/EmberRootLogo';

interface NavItem {
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.17-.59-1.61L12 11.8l-.91 1.09c-.37.44-.59 1-.59 1.61z" />
      <path d="M12 2c1 3 4 6.5 4 10a6 6 0 0 1-12 0c0-3.5 3-7 4-10 1.5 2.5 3 4 4 0z" />
    </svg>
  );
}

function RootIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="M12 15c-3 0-6 2-7 6" />
      <path d="M12 15c3 0 6 2 7 6" />
      <path d="M12 9c-2.5 0-5 1.5-6 4" />
      <path d="M12 9c2.5 0 5 1.5 6 4" />
    </svg>
  );
}

function SatchelIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 20h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      <path d="M4 11h16" />
      <path d="M12 11v3" />
    </svg>
  );
}

function ChronicleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
      <path d="M6 14h6" />
    </svg>
  );
}

function JournalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { name: 'Hearth', href: '/hearth', icon: FlameIcon },
  { name: 'Root', href: '/root', icon: RootIcon },
  { name: 'Journal', href: '/journal', icon: JournalIcon },
  { name: 'Satchel', href: '/satchel', icon: SatchelIcon },
  { name: 'Chronicle', href: '/chronicle', icon: ChronicleIcon },
  { name: 'You', href: '/settings', icon: SettingsIcon },
];

export function GameNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Skip to main content landmark for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#E98A4B] focus:text-[#141713] focus:font-semibold focus:rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:ring-offset-2 focus:ring-offset-[#141713]"
      >
        Skip to main content
      </a>

      {/* Desktop Top Header Navigation */}
      <header className="hidden md:block sticky top-0 z-40 bg-[#141713]/95 backdrop-blur border-b border-[#1D231D]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/hearth"
            className="flex items-center gap-2.5 font-['Fraunces'] text-xl font-normal text-[#F0E7D3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141713] rounded-[6px] px-1 py-1"
          >
            <EmberRootMark size={22} className="text-[#E98A4B]" />
            <span>Ember &amp; Root</span>
          </Link>

          <nav aria-label="Main Navigation" className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/hearth' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[44px] min-w-[44px] px-3.5 py-2 flex items-center gap-2 rounded-[6px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141713] ${
                    isActive
                      ? 'bg-[#1D231D] text-[#F0E7D3] border border-[#2A332A]'
                      : 'text-[#B9BEAC] hover:text-[#F0E7D3] hover:bg-[#1D231D]/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#E98A4B]' : 'text-[#B9BEAC]'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1D231D] border-t border-[#2A332A] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/hearth' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[48px] min-w-[44px] flex flex-col items-center justify-center py-2 px-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1D231D] ${
                  isActive
                    ? 'text-[#F0E7D3] font-medium'
                    : 'text-[#B9BEAC] hover:text-[#F0E7D3]'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 mb-0.5 ${
                      isActive ? 'text-[#E98A4B]' : 'text-[#B9BEAC]'
                    }`}
                  />
                  {isActive && (
                    <span
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#E98A4B] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-[11px] leading-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
