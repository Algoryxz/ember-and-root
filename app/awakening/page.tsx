import { OpeningSequence } from '@/components/public/opening/OpeningSequence';

export const metadata = {
  title: 'Something is calling — Ember & Root',
  robots: { index: false, follow: false },
};

export default function AwakeningPage() {
  return <OpeningSequence />;
}
