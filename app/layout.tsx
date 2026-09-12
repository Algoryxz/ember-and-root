import React from 'react';
import '@/components/global.css';

export const metadata = {
  title: 'Ember & Root — What you do becomes who you are',
  description: 'A Life RPG where real tasks kindle today’s Ember and grow a permanent Root shaped by your choices.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#141713] text-[#F0E7D3] antialiased">
        {children}
      </body>
    </html>
  );
}