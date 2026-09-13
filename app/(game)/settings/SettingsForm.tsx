'use client';

import React, { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updatePreferencesAction, logoutAction } from '@/app/actions/auth';

interface SettingsFormProps {
  timezone: string;
  initialSound: boolean;
  initialReducedMotion: boolean;
}

function SavePreferencesButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-[#E98A4B] text-[#141713] font-semibold text-sm rounded-[6px] transition-transform hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] disabled:opacity-50"
    >
      {pending ? 'Saving Preferences...' : 'Save Preferences'}
    </button>
  );
}

export function SettingsForm({
  timezone,
  initialSound,
  initialReducedMotion,
}: SettingsFormProps) {
  const [state, formAction] = useFormState(updatePreferencesAction, null);
  const [sound, setSound] = useState(initialSound);
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);

  return (
    <div className="space-y-8">
      {/* Timezone Section (Read-Only) */}
      <section
        aria-labelledby="timezone-heading"
        className="bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-6 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 id="timezone-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
            Timezone &amp; Rhythm
          </h2>
          <span className="text-xs text-[#B9BEAC] bg-[#141713] px-2.5 py-1 rounded-[4px] border border-[#2A332A]">
            Fixed
          </span>
        </div>
        <p className="text-xs text-[#B9BEAC]">
          Your daily resets and streak boundaries are anchored to this IANA timezone.
        </p>

        <div className="pt-2">
          <label htmlFor="settings-timezone" className="block text-xs uppercase tracking-wider text-[#B9BEAC] mb-1">
            Configured Timezone
          </label>
          <input
            id="settings-timezone"
            type="text"
            readOnly
            value={timezone}
            className="w-full bg-[#141713] border border-[#2A332A] rounded-[6px] px-3.5 py-2.5 text-sm text-[#F0E7D3] cursor-not-allowed opacity-90 focus:outline-none"
          />
          <p className="text-[11px] text-[#B9BEAC] mt-1.5">
            Timezone is locked during onboarding to preserve streak and occurrence integrity.
          </p>
        </div>
      </section>

      {/* Preferences Form */}
      <section
        aria-labelledby="preferences-heading"
        className="bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-6 space-y-5"
      >
        <div className="border-b border-[#2A332A] pb-3">
          <h2 id="preferences-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
            Experience Preferences
          </h2>
          <p className="text-xs text-[#B9BEAC] mt-0.5">
            Customize auditory feedback and motion behaviors.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          {/* Status Notifications */}
          {state?.error && (
            <div
              role="alert"
              className="p-3.5 bg-[#F0A79D]/10 border border-[#F0A79D]/40 rounded-[6px] text-xs text-[#F0A79D]"
            >
              {state.error}
            </div>
          )}

          {state?.successMessage && (
            <div
              role="status"
              className="p-3.5 bg-[#9FBA87]/10 border border-[#9FBA87]/40 rounded-[6px] text-xs text-[#9FBA87]"
            >
              {state.successMessage}
            </div>
          )}

          {/* Sound Toggle */}
          <div className="flex items-start justify-between gap-4 py-2 border-b border-[#2A332A]/50">
            <div className="space-y-0.5">
              <label htmlFor="sound-toggle" className="text-sm font-medium text-[#F0E7D3] cursor-pointer">
                Sound Effects
              </label>
              <p className="text-xs text-[#B9BEAC]">
                Play subtle tactile audio cues upon quest completion and milestone reveal (off by default).
              </p>
            </div>
            <input
              id="sound-toggle"
              name="sound"
              type="checkbox"
              checked={sound}
              onChange={(e) => setSound(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-[#2A332A] bg-[#141713] text-[#E98A4B] focus:ring-2 focus:ring-[#C4A96A] focus:ring-offset-2 focus:ring-offset-[#1D231D] cursor-pointer"
            />
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-start justify-between gap-4 py-2">
            <div className="space-y-0.5">
              <label htmlFor="motion-toggle" className="text-sm font-medium text-[#F0E7D3] cursor-pointer">
                Reduced Motion Mode
              </label>
              <p className="text-xs text-[#B9BEAC]">
                Replace continuous Ember pulses and path drawing with immediate state transitions.
              </p>
            </div>
            <input
              id="motion-toggle"
              name="reducedMotion"
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-[#2A332A] bg-[#141713] text-[#E98A4B] focus:ring-2 focus:ring-[#C4A96A] focus:ring-offset-2 focus:ring-offset-[#1D231D] cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <SavePreferencesButton />
          </div>
        </form>
      </section>

      {/* Account & Sign Out Section */}
      <section
        aria-labelledby="account-heading"
        className="bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-6 space-y-4"
      >
        <div className="border-b border-[#2A332A] pb-3">
          <h2 id="account-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
            Account Session
          </h2>
          <p className="text-xs text-[#B9BEAC] mt-0.5">
            Manage your authenticated session across devices.
          </p>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          <div>
            <p className="text-sm font-medium text-[#F0E7D3]">End Session</p>
            <p className="text-xs text-[#B9BEAC]">
              Signs out and clears your authentication cookies from this browser.
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-[#141713] border border-[#F0A79D]/40 text-[#F0A79D] hover:bg-[#F0A79D]/10 text-sm font-medium rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D]"
            >
              Sign out of Ember &amp; Root
            </button>
          </form>
        </div>
      </section>

      {/* Provenance & Hackathon Edition */}
      <section
        aria-labelledby="provenance-heading"
        className="bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-6 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 id="provenance-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
            Provenance
          </h2>
          <span className="text-[11px] uppercase tracking-wider text-[#C4A96A] bg-[#141713] px-2.5 py-1 rounded-[4px] border border-[#2A332A]">
            Tech Zephyr
          </span>
        </div>
        <p className="text-sm text-[#F0E7D3] font-medium">
          Built by <span className="text-[#E98A4B]">Algoryxz</span> for the <span className="text-[#F0E7D3]">Tech Zephyr Web Hackathon</span>.
        </p>
        <p className="text-xs text-[#B9BEAC] leading-relaxed">
          Ember &amp; Root — What you do becomes who you are. Server-authoritative progression, living botanical organism, and authentic daily causal consequences.
        </p>
      </section>
    </div>
  );
}
