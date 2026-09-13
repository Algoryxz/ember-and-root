'use client';

import React, { useRef } from 'react';
import type { CalendarMonthData } from './contracts';

export interface CalendarMonthViewProps {
  monthData: CalendarMonthData;
  selectedDate: string;
  onSelectDate: (dateString: string) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarMonthView({
  monthData,
  selectedDate,
  onSelectDate,
}: CalendarMonthViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation across the grid
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const days = monthData.days;
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = Math.max(0, index - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        nextIndex = Math.min(days.length - 1, index + 1);
        e.preventDefault();
        break;
      case 'ArrowUp':
        nextIndex = Math.max(0, index - 7);
        e.preventDefault();
        break;
      case 'ArrowDown':
        nextIndex = Math.min(days.length - 1, index + 7);
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        onSelectDate(days[index].dateString);
        e.preventDefault();
        return;
      default:
        return;
    }

    if (nextIndex !== index && days[nextIndex]) {
      onSelectDate(days[nextIndex].dateString);
      // Focus the newly selected button
      const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>('.calendar-day-cell');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div className="calendar-grid-card" aria-label="Month View">
      {/* Weekday Column Headers */}
      <div className="calendar-weekdays-row" role="row">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday-cell" role="columnheader">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div
        ref={gridRef}
        className="calendar-days-grid"
        role="grid"
        aria-label="Path Days"
      >
        {monthData.days.map((day, idx) => {
          const isSelected = day.dateString === selectedDate;
          const cellClasses = [
            'calendar-day-cell',
            day.isCurrentMonth ? 'current-month' : 'not-current-month',
            day.isToday ? 'is-today' : '',
            isSelected ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const emberGlyph =
            day.emberIntensity === 'bright'
              ? '✦'
              : day.emberIntensity === 'steady'
              ? '◆'
              : day.emberIntensity === 'kindled'
              ? '▲'
              : null;

          return (
            <button
              key={day.dateString}
              type="button"
              className={cellClasses}
              onClick={() => onSelectDate(day.dateString)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${day.dateString}: ${day.completionsCount} sealed, Ember ${day.emberIntensity}${day.isToday ? ', Today' : ''}`}
              tabIndex={isSelected ? 0 : -1}
            >
              {day.hasStreakContinuity && (
                <span className="streak-continuity-thread" aria-hidden="true" />
              )}

              <div className="day-cell-top">
                <span className="day-number">{day.dayNumber}</span>
                {emberGlyph && (
                  <span
                    className={`day-ember-mark ember-${day.emberIntensity}`}
                    aria-hidden="true"
                    title={`Ember: ${day.emberIntensity}`}
                  >
                    {emberGlyph}
                  </span>
                )}
              </div>

              <div className="day-cell-middle">
                {day.attributes.map((attr) => (
                  <span
                    key={attr}
                    className={`activity-bead attr-${attr}`}
                    aria-hidden="true"
                    title={`Practiced ${attr}`}
                  />
                ))}
              </div>

              <div className="day-cell-bottom">
                {day.completionsCount > 0 ? (
                  <span className="day-sealed-badge">
                    {day.completionsCount} sealed
                  </span>
                ) : (
                  <span className="text-transparent text-[0.65rem]">-</span>
                )}

                {day.journalNotes.length > 0 && (
                  <span
                    className="day-notes-indicator"
                    aria-hidden="true"
                    title={`${day.journalNotes.length} journal note(s)`}
                  >
                    ❧
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
