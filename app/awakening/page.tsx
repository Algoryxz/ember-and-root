import React from 'react';
import { CinematicExperience } from '@/components/public/CinematicExperience';
import Link from 'next/link';

export const metadata = {
  title: 'Cinematic Awakening — Ember & Root',
  robots: { index: false, follow: false },
};

export default function AwakeningPage() {
  return (
    <main className="min-h-screen bg-[#0F120E] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        <header className="mb-6 flex justify-between items-center text-xs tracking-widest text-[#9FBA87]/70 font-mono">
          <span>EMBER &amp; ROOT — AWAKENING</span>
          <Link href="/" className="hover:text-[#FFD38A] transition-colors">
            ← Prologue
          </Link>
        </header>
        <CinematicExperience />
      </div>
    </main>
  );
}
