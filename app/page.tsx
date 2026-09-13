import React from 'react';
import { OpeningSequence } from '@/components/public/opening/OpeningSequence';

export const metadata = {
  title: 'Ember & Root — What you do becomes who you are',
  description: 'A living personal field journal where real daily practices kindle today’s Ember and physically grow a permanent Root.',
};

export default function HomePage() {
  return <OpeningSequence />;
}
