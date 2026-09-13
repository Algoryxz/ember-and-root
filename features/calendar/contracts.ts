/**
 * Path Calendar — Contracts & Data Types
 * 
 * Re-exports canonical contracts and defines calendar-specific presentation types.
 */

import type {
  AttributeId,
  Effort,
  EmberState,
  HearthQuest,
  CalendarDayCompletion,
  CalendarDayNote,
  CalendarDayData,
  CalendarMonthData,
  CalendarViewMode,
} from '@/game/contracts';

export type {
  AttributeId,
  Effort,
  EmberState,
  HearthQuest,
  CalendarDayCompletion,
  CalendarDayNote,
  CalendarDayData,
  CalendarMonthData,
  CalendarViewMode,
};

export interface FetchCalendarMonthParams {
  year: number;
  month: number;
  timezone: string;
}

export interface CalendarMonthNavigation {
  currentYear: number;
  currentMonth: number;
  prevYear: number;
  prevMonth: number;
  nextYear: number;
  nextMonth: number;
}
