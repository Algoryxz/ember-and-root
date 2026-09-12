'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#141713] text-[#F0E7D3] text-center">
      <div className="max-w-md space-y-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#E98A4B] block">
          Folio Interruption · Server Condition
        </span>
        <h1 className="font-['Fraunces'] text-3xl font-normal text-[#F0E7D3]">
          Something interrupted the flame.
        </h1>
        <p className="text-sm text-[#B9BEAC] leading-relaxed">
          {error.message || 'An unexpected condition interrupted folio synchronization.'}
        </p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-[8px] bg-[#E98A4B] text-[#141713] font-semibold text-sm hover:bg-[#d87c3f] transition-colors"
          >
            Rekindle
          </button>
        </div>
      </div>
    </main>
  );
}
