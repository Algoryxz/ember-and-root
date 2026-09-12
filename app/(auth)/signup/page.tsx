'use client';

import React, { useTransition, useState } from 'react';
import Link from 'next/link';
import { signupAction, type AuthActionResult } from '@/app/actions/auth';
import { PathButton } from '@/components/ui/PathButton';

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await signupAction(null, formData);
      if (res) {
        setResult(res);
      }
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 bg-[#141713] text-[#F0E7D3] relative overflow-hidden">
      {/* Ambient atmospheric ember light */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#E98A4B]/10 via-[#C4A96A]/5 to-transparent pointer-events-none blur-3xl"
        aria-hidden="true"
      />

      {/* Field Journal Inscription Folio */}
      <div className="w-full max-w-lg relative z-10">
        {/* Folio Metadata & Heading */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E98A4B]" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C4A96A]">
              Folio Inscription · Entry Registry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-['Fraunces'] text-[#F0E7D3] tracking-tight leading-tight mb-3">
            Begin Your Chronicle
          </h1>
          <p className="text-sm text-[#B9BEAC] leading-relaxed max-w-sm mx-auto">
            What you do each day becomes who you are. Inscribe your name to awaken today’s Ember.
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C4A96A]/40 to-transparent mx-auto mt-6" aria-hidden="true" />
        </header>

        {result?.successMessage ? (
          <div className="space-y-6 text-center">
            <div
              role="status"
              aria-live="polite"
              className="p-6 rounded-[8px] bg-[#1A221A] border border-[#9FBA87]/40 text-[#D9E3B2] text-sm leading-relaxed"
            >
              <div className="font-serif text-lg text-[#F0E7D3] mb-2 font-normal">
                Chronicle Leaf Created
              </div>
              <p>{result.successMessage}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-[6px] bg-[#242C24] hover:bg-[#2A342A] border border-[#C4A96A]/30 text-[#F0E7D3] text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
            >
              Enter the Hearth →
            </Link>
          </div>
        ) : (
          <>
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
                  Secret Seal (min. 6 characters) <span className="text-[#E98A4B]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
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

              {/* Field 3: Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block font-mono text-xs uppercase tracking-wider text-[#B9BEAC]"
                >
                  Affirm Secret Seal <span className="text-[#E98A4B]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={isPending}
                    aria-describedby={result?.fieldErrors?.confirmPassword ? 'confirm-password-error' : undefined}
                    className="w-full h-12 px-4 rounded-[6px] bg-[#181D18]/80 border border-[#B9BEAC]/25 text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors text-sm font-mono"
                    placeholder="••••••••••••"
                  />
                </div>
                {result?.fieldErrors?.confirmPassword && (
                  <p id="confirm-password-error" className="text-xs text-[#F0A79D] pt-1">
                    {result.fieldErrors.confirmPassword[0]}
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
                  pendingText="Inscribing Chronicle…"
                  className="w-full h-13 min-h-[48px]"
                >
                  Inscribe Name into Chronicle →
                </PathButton>
              </div>
            </form>

            <footer className="mt-10 pt-6 border-t border-[#B9BEAC]/15 flex items-center justify-between text-xs text-[#B9BEAC]">
              <span>Already kindled your spark?</span>
              <Link
                href="/login"
                className="text-[#E98A4B] hover:text-[#FFD38A] font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] rounded min-h-[44px] inline-flex items-center px-2"
              >
                Sign in to Folio
              </Link>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
