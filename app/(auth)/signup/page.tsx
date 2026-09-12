'use client';

import React, { useTransition, useState } from 'react';
import Link from 'next/link';
import '@/components/public/opening/entry.css';
import { signupAction, type AuthActionResult } from '@/app/actions/auth';

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
    <main className="path-entry">
      <div className="path-inscription">
        {/* Editorial Folio Header */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] uppercase tracking-[0.16em] text-[#E98A4B] font-semibold mb-2">
            YOU FOUND THE EMBER.
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal font-['Fraunces'] text-[#F0E7D3] tracking-tight mb-2">
            CREATE YOUR PATH
          </h1>
          <p className="text-sm text-[#B9BEAC] leading-relaxed">
            What you do becomes who you are.
          </p>
          <div className="w-12 h-px bg-[#E98A4B]/40 mx-auto mt-4" aria-hidden="true" />
        </div>

        {result?.successMessage ? (
          <div className="space-y-5">
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-[6px] bg-[#1F2E1F] border border-[#9FBA87]/40 text-[#D9E3B2] text-sm leading-relaxed"
            >
              {result.successMessage}
            </div>
            <Link
              href="/login"
              className="flex items-center justify-center w-full min-h-[48px] h-12 px-4 py-3 rounded-[6px] bg-[#E98A4B] hover:brightness-105 text-[#141713] font-semibold text-sm tracking-wide uppercase transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <>
            {result?.error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-6 p-3.5 rounded-[6px] bg-[#2B1B19] border-l-2 border-[#F0A79D] text-[#F0A79D] text-sm"
              >
                {result.error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F0E7D3] mb-1.5"
                >
                  Email address <span className="text-[#E98A4B]">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isPending}
                  aria-describedby={result?.fieldErrors?.email ? 'email-error' : undefined}
                  className="w-full h-12 px-3.5 rounded-[6px] bg-[#141713] border border-[#B9BEAC]/25 text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors text-sm"
                  placeholder="wanderer@ember.game"
                />
                {result?.fieldErrors?.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-[#F0A79D]">
                    {result.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F0E7D3] mb-1.5"
                >
                  Password (min. 6 characters) <span className="text-[#E98A4B]">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isPending}
                  aria-describedby={result?.fieldErrors?.password ? 'password-error' : undefined}
                  className="w-full h-12 px-3.5 rounded-[6px] bg-[#141713] border border-[#B9BEAC]/25 text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors text-sm"
                  placeholder="••••••••••••"
                />
                {result?.fieldErrors?.password && (
                  <p id="password-error" className="mt-1.5 text-xs text-[#F0A79D]">
                    {result.fieldErrors.password[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#F0E7D3] mb-1.5"
                >
                  Confirm password <span className="text-[#E98A4B]">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isPending}
                  aria-describedby={result?.fieldErrors?.confirmPassword ? 'confirm-password-error' : undefined}
                  className="w-full h-12 px-3.5 rounded-[6px] bg-[#141713] border border-[#B9BEAC]/25 text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors text-sm"
                  placeholder="••••••••••••"
                />
                {result?.fieldErrors?.confirmPassword && (
                  <p id="confirm-password-error" className="mt-1.5 text-xs text-[#F0A79D]">
                    {result.fieldErrors.confirmPassword[0]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 min-h-[48px] mt-3 px-4 rounded-[6px] bg-[#E98A4B] hover:brightness-105 text-[#141713] font-semibold text-sm tracking-wide uppercase transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isPending ? 'Creating your path…' : 'Begin your path'}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-[#B9BEAC]/15 text-center text-sm text-[#B9BEAC]">
              <span>Already kindled your spark? </span>
              <Link
                href="/login"
                className="text-[#E98A4B] hover:text-[#FFD38A] font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] rounded min-h-[44px] inline-flex items-center"
              >
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
