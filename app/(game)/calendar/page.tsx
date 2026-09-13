import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchCalendarMonthData } from '@/features/calendar/calendarAdapter';
import { resolveTargetYearMonth } from '@/features/calendar/calendarMath';
import { CalendarView } from '@/features/calendar/CalendarView';
import type { CalendarMonthData } from '@/features/calendar/contracts';

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

  // Retrieve user's authoritative saved IANA timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .single();

  const userTimezone = profile?.timezone || 'UTC';

  // Authoritative target year and month strictly derived in user's saved timezone
  // Never falls back to server-local new Date().getMonth()
  const { year: targetYear, month: targetMonth } = resolveTargetYearMonth(
    searchParams?.month,
    userTimezone
  );

  let monthData: CalendarMonthData | null = null;
  let initialError: string | null = null;

  try {
    monthData = await fetchCalendarMonthData(targetYear, targetMonth, supabase);
  } catch (err: any) {
    initialError = err?.message || 'Unable to retrieve calendar records from the server.';
  }

  return (
    <div className="space-y-6">
      <CalendarView
        initialData={monthData}
        initialError={initialError}
        initialSelectedDate={searchParams?.day}
        userTimezone={userTimezone}
      />
    </div>
  );
}
