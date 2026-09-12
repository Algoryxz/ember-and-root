import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GameNav } from '@/components/navigation/GameNav';

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .single();

  const preferences = (profile?.preferences as { onboarded?: boolean } | null) || {};
  if (!preferences.onboarded) {
    redirect('/onboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#141713] text-[#F0E7D3]">
      <GameNav />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,16px))] md:pb-12 focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}
