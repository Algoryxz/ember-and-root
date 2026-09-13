import type { Metadata } from 'next';
import React from 'react';
import { OpeningSequence } from '@/components/public/opening/OpeningSequence';

export const metadata: Metadata = {
  title: 'Ember & Root — A Life RPG for Real-World Growth',
  description: 'Turn real-world tasks into XP, attributes, streaks, rewards, and a living Root that reflects who you are becoming.',
  alternates: {
    canonical: 'https://ember-and-root.vercel.app',
  },
};

export default function HomePage() {
  return <OpeningSequence />;
}
