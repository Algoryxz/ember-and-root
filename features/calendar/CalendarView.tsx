'use client';

import React, { useState, useTransition, useMemo } from 'react';
import type { CalendarMonthData, CalendarDayData } from './contracts';
import { calculateMonthNavigation } from './calendarMath';
import { fetchCalendarMonthData } from './calendarAdapter';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarDayDetail } from './CalendarDayDetail';
import './calendar.css';

export interface CalendarViewProps {
  initialData: CalendarMonthData;
  initialSelectedDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarView({ initialData, initialSelectedDate }: CalendarViewProps) {
  const [monthData, setMonthData] = useState<CalendarMonthData>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialSelectedDate || initialData.today || initialData.days[0]?.dateString
  );
  const [isPending, startTransition] = useTransition();

  const nav = useMemo(
    () => calculateMonthNavigation(monthData.year, monthData.month),
    [monthData.year, monthData.month]
  );

  const monthName = MONTH_NAMES[monthData.month - 1];

  // Active days in this month
  const activeDaysCount = useMemo(() => {
    return monthData.days.filter((d) => d.isCurrentMonth && d.completionsCount > 0).length;
  }, [monthData.days]);

  // Currently selected day data
  const selectedDayData: CalendarDayData | null = useMemo(() => {
    return monthData.days.find((d) => d.dateString === selectedDate) || null;
  }, [monthData.days, selectedDate]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('day', dateStr);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleNavigateMonth = (targetYear: number, targetMonth: number) => {
    startTransition(async () => {
      try {
        const nextData = await fetchCalendarMonthData(targetYear, targetMonth);
        setMonthData(nextData);

        // Keep day selected if it exists in new month, else default to 1st of month
        const targetDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        setSelectedDate(targetDateStr);

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('month', `${targetYear}-${String(targetMonth).padStart(2, '0')}`);
          url.searchParams.set('day', targetDateStr);
          window.history.replaceState(null, '', url.toString());
        }
      } catch (err) {
        console.error('Failed to navigate calendar month:', err);
      }
    });
  };

  const handleToday = () => {
    const [todayYear, todayMonth] = initialData.today.split('-').map(Number);
    if (monthData.year === todayYear && monthData.month === todayMonth) {
      handleSelectDate(initialData.today);
    } else {
      startTransition(async () => {
        try {
          const nextData = await fetchCalendarMonthData(todayYear, todayMonth);
          setMonthData(nextData);
          setSelectedDate(initialData.today);

          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('month', `${todayYear}-${String(todayMonth).padStart(2, '0')}`);
            url.searchParams.set('day', initialData.today);
            window.history.replaceState(null, '', url.toString());
          }
        } catch (err) {
          console.error('Failed to navigate to today:', err);
        }
      });
    }
  };

  return (
    <main className="path-calendar-container" aria-label="Path Calendar">
      {/* Header & Controls */}
      <header className="calendar-header">
        <div className="calendar-title-area">
          <span className="calendar-eyebrow">Botanical Folio · Path Calendar</span>
          <h1 className="calendar-month-title">
            {monthName} {monthData.year}
          </h1>
          <span className="calendar-timezone-badge">
            Timezone: {monthData.timezone}
          </span>
        </div>

        <nav className="calendar-nav-controls" aria-label="Month Navigation">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => handleNavigateMonth(nav.prevYear, nav.prevMonth)}
            disabled={isPending}
            aria-label={`Previous month: ${MONTH_NAMES[nav.prevMonth - 1]} ${nav.prevYear}`}
          >
            ← Prev
          </button>

          <button
            type="button"
            className="calendar-nav-btn today-btn"
            onClick={handleToday}
            disabled={isPending}
            aria-label="Jump to Today"
          >
            Today
          </button>

          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => handleNavigateMonth(nav.nextYear, nav.nextMonth)}
            disabled={isPending}
            aria-label={`Next month: ${MONTH_NAMES[nav.nextMonth - 1]} ${nav.nextYear}`}
          >
            Next →
          </button>
        </nav>
      </header>

      {/* Overview Metrics Strip */}
      <section className="calendar-metrics-strip" aria-label="Monthly Overview">
        <div className="calendar-metric-card">
          <span className="metric-label">Sealed Practices</span>
          <span className="metric-value highlight-sealed">
            {monthData.totalMonthCompletions}
          </span>
        </div>

        <div className="calendar-metric-card">
          <span className="metric-label">XP Harvested</span>
          <span className="metric-value highlight-xp">
            +{monthData.totalMonthXp}
          </span>
        </div>

        <div className="calendar-metric-card">
          <span className="metric-label">Sparks Garnered</span>
          <span className="metric-value highlight-sparks">
            +{monthData.totalMonthSparks}
          </span>
        </div>

        <div className="calendar-metric-card">
          <span className="metric-label">Active Days</span>
          <span className="metric-value">
            {activeDaysCount}
          </span>
        </div>
      </section>

      {/* Two-Column Grid + Detail Layout */}
      <div className={`calendar-layout ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
        <section aria-label="Calendar Month Grid">
          <CalendarMonthView
            monthData={monthData}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        </section>

        <section aria-label="Selected Day Record">
          <CalendarDayDetail
            dayData={selectedDayData}
          />
        </section>
      </div>
    </main>
  );
}
