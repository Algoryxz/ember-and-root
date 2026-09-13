import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchCalendarMonthData } from '@/features/calendar/calendarAdapter';
import { CalendarView } from '@/features/calendar/CalendarView';
import type { GameSnapshot } from '@/game/contracts';

export const metadata = {
  title: 'Path Calendar — Ember & Root',
};

export interface CalendarPageProps {
  searchParams?: {
    month?: string;
    day?: string;
  };
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const supabase = await createClient();

  // Get current game snapshot for timezone / user info
  const { data: snapshot } = await supabase.rpc('get_game_snapshot');

  // Derive target year and month
  let targetYear: number;
  let targetMonth: number;

  if (searchParams?.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
    const [y, m] = searchParams.month.split('-').map(Number);
    targetYear = y;
    targetMonth = m;
  } else {
    const now = new Date();
    targetYear = now.getFullYear();
    targetMonth = now.getMonth() + 1;
  }

  // Fetch month data using server client and game snapshot
  const monthData = await fetchCalendarMonthData(
    targetYear,
    targetMonth,
    supabase,
    (snapshot as GameSnapshot) ?? undefined
  );

  return (
    <div className="space-y-6">
      <CalendarView
        initialData={monthData}
        initialSelectedDate={searchParams?.day}
      />
    </div>
  );
}
