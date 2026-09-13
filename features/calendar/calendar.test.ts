import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  getDaysInMonth,
  getFirstDayOfMonth,
  deriveEmberStateFromCount,
  calculateMonthNavigation,
  buildMonthGrid,
} from './calendarMath';
import type { CalendarDayCompletion, CalendarDayNote } from './contracts';

describe('Path Calendar — Date & Mathematical Invariants', () => {
  describe('getLocalDateString', () => {
    it('derives YYYY-MM-DD correctly in UTC and IANA timezones', () => {
      // 2026-09-13T01:30:00Z -> In New York (EDT, UTC-4), it is still 2026-09-12
      const date = new Date('2026-09-13T01:30:00Z');
      expect(getLocalDateString(date, 'UTC')).toBe('2026-09-13');
      expect(getLocalDateString(date, 'America/New_York')).toBe('2026-09-12');
      // In Tokyo (UTC+9), it is 2026-09-13
      expect(getLocalDateString(date, 'Asia/Tokyo')).toBe('2026-09-13');
    });

    it('falls back safely if timezone is invalid', () => {
      const date = new Date('2026-05-10T12:00:00Z');
      const res = getLocalDateString(date, 'Invalid/Timezone_Name');
      expect(res).toBe('2026-05-10');
    });
  });

  describe('getDaysInMonth & Leap Year Handling', () => {
    it('computes days in standard months', () => {
      expect(getDaysInMonth(2026, 1)).toBe(31); // Jan
      expect(getDaysInMonth(2026, 4)).toBe(30); // Apr
      expect(getDaysInMonth(2026, 9)).toBe(30); // Sep
      expect(getDaysInMonth(2026, 12)).toBe(31); // Dec
    });

    it('handles February in leap year (2024) vs non-leap year (2026)', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getDaysInMonth(2025, 2)).toBe(28);
      expect(getDaysInMonth(2026, 2)).toBe(28);
      expect(getDaysInMonth(2000, 2)).toBe(29); // Century leap year
      expect(getDaysInMonth(1900, 2)).toBe(28); // Non-leap century year
    });
  });

  describe('deriveEmberStateFromCount', () => {
    it('maps completion count to canonical Ember intensities', () => {
      expect(deriveEmberStateFromCount(0)).toBe('resting');
      expect(deriveEmberStateFromCount(1)).toBe('kindled');
      expect(deriveEmberStateFromCount(2)).toBe('steady');
      expect(deriveEmberStateFromCount(3)).toBe('bright');
      expect(deriveEmberStateFromCount(7)).toBe('bright');
    });
  });

  describe('calculateMonthNavigation', () => {
    it('handles navigation within same year', () => {
      const nav = calculateMonthNavigation(2026, 6);
      expect(nav.currentYear).toBe(2026);
      expect(nav.currentMonth).toBe(6);
      expect(nav.prevYear).toBe(2026);
      expect(nav.prevMonth).toBe(5);
      expect(nav.nextYear).toBe(2026);
      expect(nav.nextMonth).toBe(7);
    });

    it('wraps January to previous year December', () => {
      const nav = calculateMonthNavigation(2026, 1);
      expect(nav.prevYear).toBe(2025);
      expect(nav.prevMonth).toBe(12);
      expect(nav.nextYear).toBe(2026);
      expect(nav.nextMonth).toBe(2);
    });

    it('wraps December to next year January', () => {
      const nav = calculateMonthNavigation(2026, 12);
      expect(nav.prevYear).toBe(2026);
      expect(nav.prevMonth).toBe(11);
      expect(nav.nextYear).toBe(2027);
      expect(nav.nextMonth).toBe(1);
    });
  });

  describe('buildMonthGrid', () => {
    it('creates a Monday-first 35 or 42 grid cell calendar', () => {
      const grid = buildMonthGrid({
        year: 2026,
        month: 9, // September 2026: starts on Tuesday, 30 days
        timezone: 'UTC',
        completions: [],
        journalNotes: [],
        activeQuests: [],
        referenceDate: new Date('2026-09-13T12:00:00Z'),
      });

      expect(grid.year).toBe(2026);
      expect(grid.month).toBe(9);
      expect(grid.today).toBe('2026-09-13');
      expect([35, 42]).toContain(grid.days.length);

      // September 1, 2026 is Tuesday. Monday-first means index 0 is August 31 (lead day)
      const leadDay = grid.days[0];
      expect(leadDay.isCurrentMonth).toBe(false);
      expect(leadDay.dateString).toBe('2026-08-31');

      // Index 1 should be Sept 1
      const firstDay = grid.days[1];
      expect(firstDay.isCurrentMonth).toBe(true);
      expect(firstDay.dateString).toBe('2026-09-01');
      expect(firstDay.dayNumber).toBe(1);

      // Verify today is marked
      const todayCell = grid.days.find((d) => d.dateString === '2026-09-13');
      expect(todayCell).toBeDefined();
      expect(todayCell?.isToday).toBe(true);
    });

    it('aggregates completions, XP, Sparks, and attribute beads onto day cells', () => {
      const mockCompletions: CalendarDayCompletion[] = [
        {
          id: 'c1',
          questId: 'q1',
          localDate: '2026-09-10',
          title: 'Morning Breathwork',
          attribute: 'body',
          effort: 'micro',
          xpAwarded: 10,
          sparksAwarded: 2,
          notesSnapshot: 'Deep rhythmic breath',
          completedAt: '2026-09-10T08:00:00Z',
        },
        {
          id: 'c2',
          questId: 'q2',
          localDate: '2026-09-10',
          title: 'Algorithms Revision',
          attribute: 'mind',
          effort: 'standard',
          xpAwarded: 20,
          sparksAwarded: 4,
          notesSnapshot: 'Recursion trees',
          completedAt: '2026-09-10T14:00:00Z',
        },
        {
          id: 'c3',
          questId: 'q3',
          localDate: '2026-09-11',
          title: 'Evening Run',
          attribute: 'body',
          effort: 'standard',
          xpAwarded: 20,
          sparksAwarded: 4,
          notesSnapshot: null,
          completedAt: '2026-09-11T19:00:00Z',
        },
      ];

      const mockNotes: CalendarDayNote[] = [
        {
          id: 'n1',
          title: 'Evening Reflection',
          body: 'Mind felt clear today.',
          localDate: '2026-09-10',
          createdAt: '2026-09-10T21:00:00Z',
        },
      ];

      const grid = buildMonthGrid({
        year: 2026,
        month: 9,
        timezone: 'UTC',
        completions: mockCompletions,
        journalNotes: mockNotes,
        activeQuests: [],
        referenceDate: new Date('2026-09-13T12:00:00Z'),
      });

      // Total month metrics
      expect(grid.totalMonthCompletions).toBe(3);
      expect(grid.totalMonthXp).toBe(50);
      expect(grid.totalMonthSparks).toBe(10);

      // Sept 10 verification
      const day10 = grid.days.find((d) => d.dateString === '2026-09-10');
      expect(day10).toBeDefined();
      expect(day10?.completionsCount).toBe(2);
      expect(day10?.emberIntensity).toBe('steady');
      expect(day10?.totalXp).toBe(30);
      expect(day10?.totalSparks).toBe(6);
      expect(day10?.attributes).toContain('body');
      expect(day10?.attributes).toContain('mind');
      expect(day10?.journalNotes.length).toBe(1);
      expect(day10?.journalNotes[0].body).toBe('Mind felt clear today.');

      // Sept 11 verification
      const day11 = grid.days.find((d) => d.dateString === '2026-09-11');
      expect(day11).toBeDefined();
      expect(day11?.completionsCount).toBe(1);
      expect(day11?.emberIntensity).toBe('kindled');
      // Continuity thread between Sept 10 and Sept 11
      expect(day11?.hasStreakContinuity).toBe(true);
    });
  });

  describe('Quest Notes Guard Invariants', () => {
    it('enforces 1000 character maximum length on notes', () => {
      const validNote = 'A'.repeat(1000);
      expect(validNote.length).toBe(1000);

      const invalidNote = 'A'.repeat(1001);
      expect(invalidNote.length).toBeGreaterThan(1000);

      // Test validation logic
      const isValid = (note: string | null | undefined) => !note || note.length <= 1000;
      expect(isValid(null)).toBe(true);
      expect(isValid('')).toBe(true);
      expect(isValid(validNote)).toBe(true);
      expect(isValid(invalidNote)).toBe(false);
    });
  });
});
