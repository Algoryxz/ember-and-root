'use client';

import React, { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SatchelView, type SatchelItem } from '@/features/satchel';
import type { GameSnapshot } from '@/game/contracts';

export interface SatchelViewWrapperProps {
  initialSnapshot?: GameSnapshot;
  catalogItems?: SatchelItem[];
}

export function SatchelViewWrapper({
  initialSnapshot,
  catalogItems,
}: SatchelViewWrapperProps) {
  const supabase = useMemo(() => createClient(), []);

  return (
    <SatchelView
      initialSnapshot={initialSnapshot}
      catalogItems={catalogItems}
      supabaseClient={supabase}
    />
  );
}
