'use client';

import React, { useTransition, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction, type AuthActionResult } from '@/app/actions/auth';
import { PathButton } from '@/components/ui/PathButton';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const formData = new FormData(event.currentTarget);
    if (next) {
      formData.set('next', next);
    }

    startTransition(async () => {
      const res = await loginAction(null, formData);
      if (res) {
        setResult(res);
      }
    });
  }

  return (
    <div className="w-full max-w-lg relative z-10">
      {/* Folio Metadata & Heading */}
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#E98A4B]" aria-hidden="true" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C4A96A]">
            Folio Gateway · Living Hearth
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-['Fraunces'] text-[#F0E7D3] tracking-tight leading-tight mb-3">
          Enter the Hearth
        </h1>
        <p className="text-sm text-[#B9BEAC] leading-relaxed max-w-sm mx-auto">
          Open today’s folio page, tend your living roots, and kindle your daily spark.
        </p>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C4A96A]/40 to-transparent mx-auto mt-6" aria-hidden="true" />
      </header>

      {result?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-8 p-4 rounded-[6px] bg-[#2B1B19] border-l-2 border-[#F0A79D] text-[#F0A79D] text-sm leading-relaxed"
        >
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Field 1: Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block font-mono text-xs uppercase tracking-wider text-[#B9BEAC]"
          >
            Wanderer Identifier (Email) <span className="text-[#E98A4B]">*</span>
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              aria-describedby={result?.fieldErrors?.email ? 'email-error' : undefined}
              className="w-full h-12 px-4 rounded-[6px] bg-[#181D18]/80 border border-[#B9BEAC]/25 text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors text-sm"
              placeholder="wanderer@ember.game"
            />
          </div>
          {result?.fieldErrors?.email && (
            <p id="email-error" className="text-xs text-[#F0A79D] pt-1">
              {result.fieldErrors.email[0]}
            </p>
          )}
        </div>

        {/* Field 2: Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block font-mono text-xs uppercase tracking-wider text-[#B9BEAC]"
          >
            Secret Seal <span className="text-[#E98A4B]">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              aria-describedby={result?.fieldErrors?.password ? 'password-error' : undefined}
              className="w-full h-12 px-4 rounded-[6px] bg-[#181D18]/80 border border-[#B9BEAC]/25 text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors text-sm font-mono"
              placeholder="••••••••••••"
            />
          </div>
          {result?.fieldErrors?.password && (
            <p id="password-error" className="text-xs text-[#F0A79D] pt-1">
              {result.fieldErrors.password[0]}
            </p>
          )}
        </div>

        {/* Physical Tactile Submit Button */}
        <div className="pt-2">
          <PathButton
            type="submit"
            variant="ember"
            size="lg"
            disabled={isPending}
            pending={isPending}
            holdingPressure={isPending}
            pendingText="Entering the Hearth…"
            className="w-full h-13 min-h-[48px]"
          >
            Open Field Journal →
          </PathButton>
        </div>
      </form>

      <footer className="mt-10 pt-6 border-t border-[#B9BEAC]/15 flex items-center justify-between text-xs text-[#B9BEAC]">
        <span>New wanderer?</span>
        <Link
          href="/signup"
          className="text-[#E98A4B] hover:text-[#FFD38A] font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] rounded min-h-[44px] inline-flex items-center px-2"
        >
          Begin your path
        </Link>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 bg-[#141713] text-[#F0E7D3] relative overflow-hidden">
      {/* Ambient atmospheric warmth */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#E98A4B]/10 via-[#C4A96A]/5 to-transparent pointer-events-none blur-3xl"
        aria-hidden="true"
      />

      <Suspense fallback={<div className="text-sm text-[#B9BEAC] font-mono">Loading Hearth gateway…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
