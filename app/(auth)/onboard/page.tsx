import React from 'react';
import { OnboardingExperience } from '@/features/onboarding/OnboardingExperience';

export const metadata = {
  title: 'Begin Your Path — Ember & Root',
  description: 'Choose your starting intentions and kindle your first flame.',
};

export default function OnboardingPage() {
  return <OnboardingExperience />;
}