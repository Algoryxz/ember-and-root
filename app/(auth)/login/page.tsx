'use client';

import React, { useTransition, useState, Suspense } from 'react';
import Link from 'next/link';
import '@/components/public/opening/entry.css';
import { useSearchParams } from 'next/navigation';
import { loginAction, type AuthActionResult } from '@/app/actions/auth';
import { EmberRootMark } from '@/components/brand/EmberRootLogo';
import { useEntryAudio } from '@/components/public/opening/EntryAudioProvider';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const { startExitTransition, isExiting } = useEntryAudio();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isExiting) return;
    setResult(null);
    const formData = new FormData(event.currentTarget);
    if (next) {
      formData.set('next', next);
    }

    startTransition(async () => {
      const res = await loginAction(null, formData);
      if (res) {
        if (res.redirectTo) {
          // Confirmed successful authentication: initiate slow 2-3s cinematic fade
          await startExitTransition(res.redirectTo);
        } else {
          // Failure / invalid credentials: audio stays alive, no fade
          setResult(res);
        }
      }
    });
  }

  return (
    <div className="path-inscription">
      {/* Editorial Folio Header */}
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center mb-4 rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D]"
          aria-label="Return to Ember and Root prologue"
        >
          <EmberRootMark size={36} />
        </Link>
        <div>
          <span className="inline-block text-[11px] uppercase tracking-[0.16em] text-[#E98A4B] font-semibold mb-2">
            THE PATH CONTINUES.
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-normal font-['Fraunces'] text-[#F0E7D3] tracking-tight mb-2">
          SIGN IN
        </h1>
        <p className="text-sm text-[#B9BEAC] leading-relaxed">
          Your Ember is waiting.
        </p>
        <div className="w-12 h-px bg-[#E98A4B]/40 mx-auto mt-4" aria-hidden="true" />
      </div>

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
            disabled={isPending || isExiting}
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
            Password <span className="text-[#E98A4B]">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending || isExiting}
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

        <button
          type="submit"
          disabled={isPending || isExiting}
          className="w-full h-12 min-h-[48px] mt-3 px-4 rounded-[6px] bg-[#E98A4B] hover:brightness-105 text-[#141713] font-semibold text-sm tracking-wide uppercase transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isExiting ? 'Entering your path…' : isPending ? 'Entering the Hearth…' : 'Return to the Hearth'}
        </button>
      </form>

      <div className="mt-8 pt-5 border-t border-[#B9BEAC]/15 text-center text-sm text-[#B9BEAC]">
        <span>New wanderer? </span>
        <Link
          href="/signup"
          className="text-[#E98A4B] hover:text-[#FFD38A] font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] rounded min-h-[44px] inline-flex items-center"
        >
          Begin your path
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { isMuted, toggleMute, isExiting } = useEntryAudio();
  return (
    <main className="path-entry" data-exiting={isExiting}>
      <div className="path-entry-tools">
        <button
          type="button"
          className="prologue-sound-btn"
          onClick={toggleMute}
          aria-label={isMuted ? 'Enable entry sound' : 'Mute entry sound'}
          aria-pressed={!isMuted}
        >
          {isMuted ? 'Sound Off' : 'Sound On'}
        </button>
      </div>
      <Suspense fallback={<div className="text-sm text-[#B9BEAC]">Loading Hearth gateway…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
