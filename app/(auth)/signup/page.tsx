'use client';

import React, { useTransition, useState } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#141713] text-[#F0E7D3]">
      <div className="w-full max-w-md p-6 sm:p-8 bg-[#1D231D] rounded-xl border border-[#2D382D] shadow-2xl">
        <div className="text-center mb-6">
          <span className="inline-block text-xs uppercase tracking-widest text-[#B9BEAC] font-medium mb-1">
            Ember &amp; Root
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal text-[#F0E7D3] tracking-tight">
            Begin Your Chronicle
          </h1>
          <p className="text-sm text-[#B9BEAC] mt-1">
            What you do becomes who you are.
          </p>
        </div>

        {result?.successMessage ? (
          <div className="space-y-4">
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-lg bg-[#1F2E1F] border border-[#9FBA87]/40 text-[#D9E3B2] text-sm leading-relaxed"
            >
              {result.successMessage}
            </div>
            <Link
              href="/login"
              className="block w-full text-center h-12 px-4 py-3 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
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
                className="mb-6 p-3 rounded-lg bg-[#2B1B19] border border-[#F0A79D]/40 text-[#F0A79D] text-sm"
              >
                {result.error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#F0E7D3] mb-1"
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
                  className="w-full h-11 px-3 rounded-lg bg-[#141713] border border-[#374537] text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors"
                  placeholder="wanderer@ember.game"
                />
                {result?.fieldErrors?.email && (
                  <p id="email-error" className="mt-1 text-xs text-[#F0A79D]">
                    {result.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#F0E7D3] mb-1"
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
                  className="w-full h-11 px-3 rounded-lg bg-[#141713] border border-[#374537] text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                {result?.fieldErrors?.password && (
                  <p id="password-error" className="mt-1 text-xs text-[#F0A79D]">
                    {result.fieldErrors.password[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[#F0E7D3] mb-1"
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
                  className="w-full h-11 px-3 rounded-lg bg-[#141713] border border-[#374537] text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                {result?.fieldErrors?.confirmPassword && (
                  <p id="confirm-password-error" className="mt-1 text-xs text-[#F0A79D]">
                    {result.fieldErrors.confirmPassword[0]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 mt-2 px-4 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isPending ? 'Forging Profile…' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#2D382D] text-center text-sm text-[#B9BEAC]">
              <span>Already kindle your spark? </span>
              <Link
                href="/login"
                style={{ color: '#E98A4B' }}
                className="text-[#E98A4B] hover:text-[#FFD38A] font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] rounded"
              >
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}