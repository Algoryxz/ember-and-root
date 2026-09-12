import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#141713] text-[#F0E7D3] text-center">
      <div className="max-w-md space-y-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C4A96A] block">
          Folio Notice · Uncharted Path
        </span>
        <h1 className="font-['Fraunces'] text-4xl font-normal text-[#F0E7D3]">
          404 — Path Unknown
        </h1>
        <p className="text-sm text-[#B9BEAC] leading-relaxed">
          The page you seek has not been inscribed in this chronicle.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-[8px] bg-[#E98A4B] text-[#141713] font-semibold text-sm hover:bg-[#d87c3f] transition-colors"
          >
            Return to Hearth
          </Link>
        </div>
      </div>
    </main>
  );
}
