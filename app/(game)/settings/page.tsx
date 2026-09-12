import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from './SettingsForm';

export const metadata = {
  title: 'Settings — Ember & Root',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, preferences')
    .single();

  const preferences = (profile?.preferences as { sound?: boolean; reducedMotion?: boolean } | null) || {};
  const timezone = profile?.timezone || 'UTC';
  const initialSound = Boolean(preferences.sound);
  const initialReducedMotion = Boolean(preferences.reducedMotion);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-['Fraunces'] text-3xl font-normal text-[#F0E7D3] mb-1">
          Settings
        </h1>
        <p className="text-sm text-[#B9BEAC]">
          Configure your preferences, inspect rhythm settings, and manage your session.
        </p>
      </div>

      <SettingsForm
        timezone={timezone}
        initialSound={initialSound}
        initialReducedMotion={initialReducedMotion}
      />
    </div>
  );
}
