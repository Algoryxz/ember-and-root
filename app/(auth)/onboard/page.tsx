'use client';

import React, { useTransition, useState, useEffect } from 'react';
import { completeOnboardingAction, type AuthActionResult } from '@/app/actions/auth';

const COMMON_TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
];

export default function OnboardingPage() {
  const [detectedTimezone, setDetectedTimezone] = useState<string>('UTC');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setDetectedTimezone(tz);
        setSelectedTimezone(tz);
      }
    } catch {
      // fallback to UTC
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await completeOnboardingAction(null, formData);
      if (res) {
        setResult(res);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#141713] text-[#F0E7D3]">
      <div className="w-full max-w-md p-6 sm:p-8 bg-[#1D231D] rounded-xl border border-[#2D382D] shadow-2xl">
        <div className="text-center mb-6">
          <span className="inline-block text-xs uppercase tracking-widest text-[#E98A4B] font-medium mb-1">
            Setting the Cycle
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal text-[#F0E7D3] tracking-tight">
            Welcome, Wanderer
          </h1>
          <p className="text-sm text-[#B9BEAC] mt-2 leading-relaxed">
            Your Ember resets with your local midnight. Confirm your timezone so daily quests and streak records stay true to your sun.
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

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-[#F0E7D3] mb-1"
            >
              Your Local Timezone (IANA) <span className="text-[#E98A4B]">*</span>
            </label>
            <input
              id="timezone"
              name="timezone"
              type="text"
              required
              disabled={isPending}
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              list="timezone-options"
              aria-describedby={result?.fieldErrors?.timezone ? 'tz-error' : 'tz-hint'}
              className="w-full h-11 px-3 rounded-lg bg-[#141713] border border-[#374537] text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A] focus:border-transparent transition-colors"
            />
            <datalist id="timezone-options">
              {Array.from(new Set([detectedTimezone, ...COMMON_TIMEZONES])).map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
            <p id="tz-hint" className="mt-1 text-xs text-[#B9BEAC]">
              Detected from browser: <span className="text-[#FFD38A]">{detectedTimezone}</span>
            </p>
            {result?.fieldErrors?.timezone && (
              <p id="tz-error" className="mt-1 text-xs text-[#F0A79D]">
                {result.fieldErrors.timezone[0]}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-[#141713] border border-[#2D382D] text-xs text-[#B9BEAC] leading-relaxed">
            <span className="font-semibold text-[#F0E7D3]">Note on permanence:</span> Your timezone aligns the daily 140 XP cap, Ember kindling, and streak continuity.
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 mt-2 px-4 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isPending ? 'Kindling the Hearth…' : 'Enter the Hearth'}
          </button>
        </form>
      </div>
    </div>
  );
}