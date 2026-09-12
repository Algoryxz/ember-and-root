import React from 'react';

export const metadata = {
  title: 'Ember & Root',
  description: 'What you do becomes who you are.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#141713' }}>{children}</body>
    </html>
  );
}
