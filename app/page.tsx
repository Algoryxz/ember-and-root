import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#141713] text-[#F0E7D3]">
      <div className="w-full max-w-xl text-center space-y-8 p-8 sm:p-12 rounded-2xl bg-[#1D231D] border border-[#2D382D] shadow-2xl">
        <div className="space-y-3">
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-[#E98A4B] font-semibold">
            An Illuminated Life RPG
          </span>
          <h1 className="text-4xl sm:text-5xl font-normal text-[#F0E7D3] tracking-tight">
            Ember &amp; Root
          </h1>
          <p className="text-lg text-[#FFD38A] italic font-serif">
            &ldquo;What you do becomes who you are.&rdquo;
          </p>
        </div>

        <p className="text-[#B9BEAC] text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          Every completed quest kindles today&apos;s Ember and permanently shapes your Root. Choose your specializations, conquer trials, and claim your crests.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] active:scale-[0.98]"
          >
            Enter the Hearth
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-transparent hover:bg-[#262F26] border border-[#3D4C3D] text-[#F0E7D3] font-medium text-base transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] active:scale-[0.98]"
          >
            Begin Your Chronicle
          </Link>
        </div>
      </div>
    </main>
  );
}