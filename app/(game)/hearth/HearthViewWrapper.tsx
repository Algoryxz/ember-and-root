'use client';

import React, { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HearthView } from '@/features/hearth';
import type { GameSnapshot } from '@/game/contracts';

export interface HearthViewWrapperProps {
  initialSnapshot?: GameSnapshot;
  serverError?: string;
}

export function HearthViewWrapper({ initialSnapshot, serverError }: HearthViewWrapperProps) {
  const supabase = useMemo(() => createClient(), []);

  return (
    <HearthView
      initialSnapshot={initialSnapshot}
      serverError={serverError}
      supabaseClient={supabase}
      showShellNav={false}
    />
  );
}
