/**
 * Path Calendar — Deterministic Date & Grid Mathematics
 * 
 * Invariants:
 * 1. Timezone-safe local date derivation via Intl.DateTimeFormat (never browser UTC).
 * 2. DST-safe grid construction.
 * 3. Pure TypeScript calculations with zero external AI or date-library dependencies.
 * 4. Derives Ember intensity and streak continuity paths server/client side deterministically.
 */

import type { AttributeId, EmberState, HearthQuest } from '@/game/contracts';
import type {
  CalendarDayCompletion,
  CalendarDayData,
  CalendarDayNote,
  CalendarMonthData,
  CalendarMonthNavigation,
} from './contracts';

/**
 * Derives a 'YYYY-MM-DD' date string for a given Date in a specific IANA timezone.
 */
export function getLocalDateString(date: Date = new Date(), timeZone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().split('T')[0];
  }
}

/**
 * Returns the number of days in a given year and month (1-indexed, e.g., 2 for Feb).
 * Correctly accounts for leap years.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns the day of the week for the 1st of the month (0 = Sunday, 1 = Monday, etc.).
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Canonical Ember intensity derivation from daily completed quest count.
 */
export function deriveEmberStateFromCount(count: number): EmberState {
  if (count <= 0) return 'resting';
  if (count === 1) return 'kindled';
  if (count === 2) return 'steady';
  return 'bright';
}

/**
 * Computes previous and next month navigation coordinates.
 */
export function calculateMonthNavigation(year: number, month: number): CalendarMonthNavigation {
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    currentYear: year,
    currentMonth: month,
    prevYear,
    prevMonth,
    nextYear,
    nextMonth,
  };
}

export interface BuildMonthGridParams {
  year: number;
  month: number;
  timezone: string;
  completions: CalendarDayCompletion[];
  journalNotes: CalendarDayNote[];
  activeQuests: HearthQuest[];
  referenceDate?: Date;
}

/**
 * Builds the full 35 or 42 cell monthly grid (Monday-first) populated with completions,
 * Ember intensities, attribute activity beads, planned practices, and streak continuity lines.
 */
export function buildMonthGrid({
  year,
  month,
  timezone,
  completions = [],
  journalNotes = [],
  activeQuests = [],
  referenceDate = new Date(),
}: BuildMonthGridParams): CalendarMonthData {
  const todayString = getLocalDateString(referenceDate, timezone);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);

  // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDaySunFirst = getFirstDayOfMonth(year, month);
  // Convert to Monday-first (0 = Mon, 1 = Tue ... 6 = Sun)
  const leadDays = firstDaySunFirst === 0 ? 6 : firstDaySunFirst - 1;

  // Group completions and notes by localDate ('YYYY-MM-DD')
  const completionsByDate = new Map<string, CalendarDayCompletion[]>();
  for (const c of completions) {
    const list = completionsByDate.get(c.localDate) || [];
    list.push(c);
    completionsByDate.set(c.localDate, list);
  }

  const notesByDate = new Map<string, CalendarDayNote[]>();
  for (const n of journalNotes) {
    const list = notesByDate.get(n.localDate) || [];
    list.push(n);
    notesByDate.set(n.localDate, list);
  }

  const gridCells: CalendarDayData[] = [];

  // 1. Lead days from previous month
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  for (let i = leadDays - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayCompletions = completionsByDate.get(dateStr) || [];
    const dayNotes = notesByDate.get(dateStr) || [];

    gridCells.push(
      createDayCell({
        dateString: dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayString,
        completions: dayCompletions,
        journalNotes: dayNotes,
        activeQuests,
      })
    );
  }

  // 2. Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayCompletions = completionsByDate.get(dateStr) || [];
    const dayNotes = notesByDate.get(dateStr) || [];

    gridCells.push(
      createDayCell({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayString,
        completions: dayCompletions,
        journalNotes: dayNotes,
        activeQuests,
      })
    );
  }

  // 3. Tail days to complete final week
  const totalCells = gridCells.length;
  const targetCells = totalCells > 35 ? 42 : 35;
  const tailDays = targetCells - totalCells;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  for (let t = 1; t <= tailDays; t++) {
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(t).padStart(2, '0')}`;
    const dayCompletions = completionsByDate.get(dateStr) || [];
    const dayNotes = notesByDate.get(dateStr) || [];

    gridCells.push(
      createDayCell({
        dateString: dateStr,
        dayNumber: t,
        isCurrentMonth: false,
        isToday: dateStr === todayString,
        completions: dayCompletions,
        journalNotes: dayNotes,
        activeQuests,
      })
    );
  }

  // 4. Compute streak continuity between adjacent days
  for (let i = 1; i < gridCells.length; i++) {
    const prevCell = gridCells[i - 1];
    const currCell = gridCells[i];
    if (prevCell.completionsCount > 0 && currCell.completionsCount > 0) {
      currCell.hasStreakContinuity = true;
    }
  }

  // 5. Month totals
  const totalMonthXp = completions.reduce((acc, c) => acc + (c.xpAwarded || 0), 0);
  const totalMonthSparks = completions.reduce((acc, c) => acc + (c.sparksAwarded || 0), 0);
  const totalMonthCompletions = completions.length;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  return {
    year,
    month,
    timezone,
    today: todayString,
    startDate,
    endDate,
    days: gridCells,
    totalMonthXp,
    totalMonthSparks,
    totalMonthCompletions,
  };
}

function createDayCell({
  dateString,
  dayNumber,
  isCurrentMonth,
  isToday,
  completions,
  journalNotes,
  activeQuests,
}: {
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  completions: CalendarDayCompletion[];
  journalNotes: CalendarDayNote[];
  activeQuests: HearthQuest[];
}): CalendarDayData {
  const count = completions.length;
  const totalXp = completions.reduce((sum, c) => sum + (c.xpAwarded || 0), 0);
  const totalSparks = completions.reduce((sum, c) => sum + (c.sparksAwarded || 0), 0);

  // Distinct attributes active on that day
  const attrSet = new Set<AttributeId>();
  for (const c of completions) {
    if (c.attribute) attrSet.add(c.attribute);
  }

  // Planned quests:
  // - Daily quests are planned for today/future days
  // - Single milestone quests created on or before this day
  const planned = isToday
    ? activeQuests.filter((q) => !q.completedForCurrentOccurrence)
    : activeQuests.filter((q) => q.cadence === 'daily');

  return {
    dateString,
    dayNumber,
    isCurrentMonth,
    isToday,
    completions,
    completionsCount: count,
    emberIntensity: deriveEmberStateFromCount(count),
    totalXp,
    totalSparks,
    attributes: Array.from(attrSet),
    plannedQuests: planned,
    journalNotes,
    hasStreakContinuity: false,
  };
}
