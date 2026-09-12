'use client';

import React from 'react';
import { ChronicleView } from '@/features/chronicle';
import type { GameSnapshot } from '@/game/contracts';
import type { ChronicleEntry } from '@/features/chronicle';

export interface ChronicleWrapperProps {
  initialSnapshot: GameSnapshot;
  entries: ChronicleEntry[];
}

export function ChronicleWrapper({ initialSnapshot, entries }: ChronicleWrapperProps) {
  return (
    <ChronicleView
      initialSnapshot={initialSnapshot}
      entries={entries}
    />
  );
}
