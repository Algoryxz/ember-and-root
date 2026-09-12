'use client';

import React, { useTransition, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction, type AuthActionResult } from '@/app/actions/auth';

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
    <div className="w-full max-w-md p-6 sm:p-8 bg-[#1D231D] rounded-xl border border-[#2D382D] shadow-2xl">
      <div className="text-center mb-6">
        <span className="inline-block text-xs uppercase tracking-widest text-[#B9BEAC] font-medium mb-1">
          Ember &amp; Root
        </span>
        <h1 className="text-3xl sm:text-4xl font-normal text-[#F0E7D3] tracking-tight">
          Enter the Hearth
        </h1>
        <p className="text-sm text-[#B9BEAC] mt-1">
          Kindle your daily chronicle and tend your roots.
        </p>
      </div>

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
            Password <span className="text-[#E98A4B]">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 mt-2 px-4 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isPending ? 'Entering the Hearth…' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#2D382D] text-center text-sm text-[#B9BEAC]">
        <span>New wanderer? </span>
        <Link
          href="/signup"
          style={{ color: '#E98A4B' }}
          className="text-[#E98A4B] hover:text-[#FFD38A] font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] rounded"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#141713] text-[#F0E7D3]">
      <Suspense fallback={<div className="text-sm text-[#B9BEAC]">Loading Hearth gateway…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}