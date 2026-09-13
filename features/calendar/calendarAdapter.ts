/**
 * Path Calendar Data Adapter
 * 
 * Fetches server-authoritative monthly activity aggregation from Supabase PostgreSQL,
 * with deterministic offline/demo fallback using canonical progression fixtures.
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { DEMO_SNAPSHOT } from '@/game/fixtures/snapshot';
import type { GameSnapshot, HearthQuest } from '@/game/contracts';
import { buildMonthGrid, getLocalDateString } from './calendarMath';
import type {
  CalendarDayCompletion,
  CalendarDayNote,
  CalendarMonthData,
} from './contracts';

function getClient(passedClient?: any): any {
  if (passedClient && typeof passedClient.from === 'function') {
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
    try {
      // 1. Try authoritative RPC get_calendar_month
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_calendar_month', {
        p_year: year,
        p_month: month,
      });

      if (!rpcError && rpcData && Array.isArray(rpcData.completions)) {
        const { data: activeQuests } = await supabase
          .from('quests')
          .select('*')
          .is('deleted_at', null);

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

      // 2. Fallback to direct table queries if RPC is not yet in cache
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .single();

      const timezone = profile?.timezone || 'UTC';
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

      const [completionsRes, notesRes, questsRes] = await Promise.all([
        supabase
          .from('quest_completions')
          .select('id, quest_id, local_date, quest_title_snapshot, quest_attribute_snapshot, quest_effort_snapshot, xp_awarded, sparks_awarded, quest_notes_snapshot, completed_at')
          .gte('local_date', startDate)
          .lte('local_date', endDate),
        supabase
          .from('journal_notes')
          .select('id, title, body, created_at'),
        supabase
          .from('quests')
          .select('*')
          .is('deleted_at', null),
      ]);

      const completions: CalendarDayCompletion[] = (completionsRes.data || []).map((c: any) => ({
        id: c.id,
        questId: c.quest_id,
        localDate: c.local_date,
        title: c.quest_title_snapshot,
        attribute: c.quest_attribute_snapshot,
        effort: c.quest_effort_snapshot,
        xpAwarded: c.xp_awarded,
        sparksAwarded: c.sparks_awarded,
        notesSnapshot: c.quest_notes_snapshot,
        completedAt: c.completed_at,
      }));

      const notes: CalendarDayNote[] = (notesRes.data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        localDate: getLocalDateString(new Date(n.created_at), timezone),
        createdAt: n.created_at,
      }));

      const activeQuests: HearthQuest[] = (questsRes.data || []).map((q: any) => ({
        ...q,
        currentOccurrenceKey: getLocalDateString(new Date(), timezone),
        completedForCurrentOccurrence: false,
      }));

      return buildMonthGrid({
        year,
        month,
        timezone,
        completions,
        journalNotes: notes,
        activeQuests,
      });
    } catch (err) {
      console.warn('fetchCalendarMonthData remote query failed, falling back to local simulation:', err);
    }
  }

  // 3. Fixture / Offline Fallback Mode
  const snapshot = providedSnapshot || DEMO_SNAPSHOT;
  const timezone = 'America/New_York';
  const todayStr = getLocalDateString(new Date(), timezone);

  // Generate deterministic fixture completions for the current month
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

  // Check for local storage notes if in browser
  let localNotes: CalendarDayNote[] = [];
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('ember_journal_notes_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        localNotes = (parsed || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          localDate: getLocalDateString(new Date(n.createdAt), timezone),
          createdAt: n.createdAt,
        }));
      }
    } catch {
      // Ignore storage errors
    }
  }

  return buildMonthGrid({
    year,
    month,
    timezone,
    completions: demoCompletions,
    journalNotes: localNotes,
    activeQuests: (snapshot.quests as HearthQuest[]) || [],
  });
}
