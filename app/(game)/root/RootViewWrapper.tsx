'use client';

import React, { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RootInteractiveView } from '@/features/root';
import type { GameSnapshot } from '@/game/contracts';

export interface RootViewWrapperProps {
  initialSnapshot?: GameSnapshot;
}

export function RootViewWrapper({ initialSnapshot }: RootViewWrapperProps) {
  const supabase = useMemo(() => createClient(), []);

  return (
    <RootInteractiveView
      snapshot={initialSnapshot}
      supabaseClient={supabase}
      showDevPresets={false}
    />
  );
}
