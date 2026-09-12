'use client';

import React, { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SatchelView } from '@/features/satchel';
import type { GameSnapshot } from '@/game/contracts';

export interface SatchelWrapperProps {
  initialSnapshot: GameSnapshot;
}

export function SatchelWrapper({ initialSnapshot }: SatchelWrapperProps) {
  const supabase = useMemo(() => createClient(), []);

  return (
    <SatchelView
      initialSnapshot={initialSnapshot}
      supabaseClient={supabase}
    />
  );
}
