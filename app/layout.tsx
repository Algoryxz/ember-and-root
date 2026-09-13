import type { Metadata, Viewport } from 'next';
import React from 'react';
import '@/components/global.css';
import { EntryAudioProvider } from '@/components/public/opening/EntryAudioProvider';

const BASE_URL = 'https://ember-and-root.vercel.app';

export const viewport: Viewport = {
  themeColor: '#141713',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Ember & Root — A Life RPG for Real-World Growth',
    template: '%s | Ember & Root',
  },
  description: 'Turn real-world tasks into XP, attributes, streaks, rewards, and a living Root that reflects who you are becoming.',
  applicationName: 'Ember & Root',
  authors: [{ name: 'Algoryxz' }],
  creator: 'Algoryxz',
  publisher: 'Algoryxz',
  keywords: [
    'Life RPG',
    'gamified productivity',
    'habit tracker',
    'task RPG',
    'personal growth',
    'productivity game',
    'Ember & Root',
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Ember & Root — A Life RPG for Real-World Growth',
    description: 'Turn real-world tasks into XP, attributes, streaks, rewards, and a living Root that reflects who you are becoming.',
    url: BASE_URL,
    siteName: 'Ember & Root',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/brand/video-card-dark-1080p.png',
        width: 1920,
        height: 1080,
        alt: 'Ember & Root — What you do becomes who you are',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ember & Root — A Life RPG for Real-World Growth',
    description: 'Turn real-world tasks into XP, attributes, streaks, rewards, and a living Root that reflects who you are becoming.',
    creator: '@Algoryxz',
    images: ['/brand/video-card-dark-1080p.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#141713] text-[#F0E7D3] antialiased">
        <EntryAudioProvider>
          {children}
        </EntryAudioProvider>
      </body>
    </html>
  );
}
