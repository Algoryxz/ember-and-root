/**
 * Path Calendar Data Adapter
 * 
 * Invariants:
 * 1. Authoritative aggregation fetched strictly via get_calendar_month RPC.
 * 2. On remote failure, throws explicit Error; NEVER silently shows DEMO_SNAPSHOT or simulated data.
 * 3. Journal entries come exclusively from canonical Supabase journal_notes. Zero localStorage reads.
 * 4. Demo fallback is strictly gated to non-production/test environments when client is null.
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { DEMO_SNAPSHOT } from '@/game/fixtures/snapshot';
import type { GameSnapshot, HearthQuest } from '@/game/contracts';
import { buildMonthGrid } from './calendarMath';
import type {
  CalendarDayCompletion,
  CalendarMonthData,
} from './contracts';

function getClient(passedClient?: any): any {
  if (passedClient && typeof passedClient.rpc === 'function') {
    return passedClient;
  }
  if (passedClient === null) {
    return null;
  }
  if (typeof window !== 'undefined') {
    try {
      return createBrowserClient();
    } catch {
      return null;
    }
  }
  return null;
}

export async function fetchCalendarMonthData(
  year: number,
  month: number,
  passedClient?: any,
  providedSnapshot?: GameSnapshot
): Promise<CalendarMonthData> {
  const supabase = getClient(passedClient);

  if (supabase) {
    // 1. Production/Authenticated Mode: Call authoritative Supabase PostgreSQL RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_calendar_month', {
      p_year: year,
      p_month: month,
    });

    if (rpcError) {
      throw new Error(`Failed to load calendar records: ${rpcError.message || JSON.stringify(rpcError)}`);
    }

    if (!rpcData || !Array.isArray(rpcData.completions)) {
      throw new Error('Server returned invalid calendar records.');
    }

    const { data: activeQuests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .is('deleted_at', null);

    if (questsError) {
      throw new Error(`Failed to load active quests: ${questsError.message || JSON.stringify(questsError)}`);
    }

    const mappedQuests: HearthQuest[] = (activeQuests || []).map((q: any) => ({
      ...q,
      currentOccurrenceKey: rpcData.today,
      completedForCurrentOccurrence: false,
    }));

    return buildMonthGrid({
      year,
      month,
      timezone: rpcData.timezone || 'UTC',
      completions: rpcData.completions,
      journalNotes: rpcData.notes || [],
      activeQuests: mappedQuests,
    });
  }

  // 2. Production guard: In production, missing client is an error
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Authentication required: please sign in to view your path calendar.');
  }

  // 3. Fixture / Dev / Test Mock Mode (strictly non-production, no localStorage)
  const snapshot = providedSnapshot || DEMO_SNAPSHOT;
  const timezone = 'America/New_York';

  const demoCompletions: CalendarDayCompletion[] = [];
  if (snapshot.currentStreak > 0) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    if (year === currentYear && month === currentMonth) {
      const todayDateNum = today.getDate();
      for (let i = 0; i < Math.min(snapshot.currentStreak, todayDateNum); i++) {
        const dayNum = todayDateNum - i;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        demoCompletions.push({
          id: `comp-fixture-${dayNum}`,
          localDate: dateStr,
          title: i === 0 ? 'Finish Java recursion practice' : 'Dawn Breathing & Mobility',
          attribute: i % 2 === 0 ? 'mind' : 'body',
          effort: 'standard',
          xpAwarded: 20,
          sparksAwarded: 4,
          notesSnapshot: 'Completed with steady focus.',
          completedAt: `${dateStr}T12:00:00Z`,
        });
      }
    }
  }

  return buildMonthGrid({
    year,
    month,
    timezone,
    completions: demoCompletions,
    journalNotes: [],
    activeQuests: (snapshot.quests as HearthQuest[]) || [],
  });
}
