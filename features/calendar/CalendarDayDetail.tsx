'use client';

import React from 'react';
import type { CalendarDayData } from './contracts';

export interface CalendarDayDetailProps {
  dayData: CalendarDayData | null;
  onClose?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatHumanDate(dateString: string): string {
  try {
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = MONTH_NAMES[m - 1];
    return `${weekday}, ${month} ${d}, ${y}`;
  } catch {
    return dateString;
  }
}

export function CalendarDayDetail({ dayData, onClose }: CalendarDayDetailProps) {
  if (!dayData) {
    return (
      <aside className="calendar-detail-panel" aria-label="Day Details">
        <p className="detail-empty-notice">Select any day on the path to inspect practices, seals, and journal records.</p>
      </aside>
    );
  }

  const {
    dateString,
    isToday,
    completions,
    completionsCount,
    emberIntensity,
    totalXp,
    totalSparks,
    plannedQuests,
    journalNotes,
    hasStreakContinuity,
  } = dayData;

  const humanDate = formatHumanDate(dateString);

  return (
    <aside className="calendar-detail-panel" aria-label={`Details for ${humanDate}`}>
      <div className="detail-header">
        <div className="flex items-center justify-between">
          <span className="calendar-eyebrow">
            {isToday ? 'Today on the Path' : 'Daily Record'}
          </span>
          {hasStreakContinuity && (
            <span className="text-xs text-[#E98A4B] font-semibold flex items-center gap-1">
              <span aria-hidden="true">✦</span> Path Thread Active
            </span>
          )}
        </div>
        <h3 className="detail-date-title">{humanDate}</h3>

        <div className="detail-stats-row">
          <span className="detail-stat-pill">
            <span className="text-[#C4A96A]" aria-hidden="true">◎</span>
            <strong>{completionsCount}</strong> sealed
          </span>
          <span className="detail-stat-pill">
            <span className="text-[#9FBA87]" aria-hidden="true">▲</span>
            <strong>+{totalXp}</strong> XP
          </span>
          <span className="detail-stat-pill">
            <span className="text-[#C4A96A]" aria-hidden="true">✧</span>
            <strong>+{totalSparks}</strong> Sparks
          </span>
          <span className="detail-stat-pill">
            Ember: <strong className="capitalize text-[#E98A4B]">{emberIntensity}</strong>
          </span>
        </div>
      </div>

      {/* Sealed Practices Section */}
      <div className="detail-section">
        <h4 className="detail-section-title">Sealed Practices ({completions.length})</h4>
        {completions.length === 0 ? (
          <p className="detail-empty-notice">No practices were sealed on this day.</p>
        ) : (
          <ul className="detail-items-list" role="list">
            {completions.map((comp) => (
              <li key={comp.id} className="detail-item-card">
                <div className="detail-item-header">
                  <span className="detail-item-title">{comp.title}</span>
                  <span className={`detail-item-tag attr-${comp.attribute}`}>
                    {comp.attribute}
                  </span>
                </div>
                <div className="detail-item-meta">
                  <span>+{comp.xpAwarded} XP</span>
                  <span>·</span>
                  <span>+{comp.sparksAwarded} Sparks</span>
                  <span>·</span>
                  <span className="uppercase text-[0.68rem]">{comp.effort}</span>
                </div>
                {comp.notesSnapshot && (
                  <div className="detail-item-note">
                    <span aria-hidden="true">❧ </span>
                    {comp.notesSnapshot}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Planned Practices Section */}
      {plannedQuests.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">Planned Practices ({plannedQuests.length})</h4>
          <ul className="detail-items-list" role="list">
            {plannedQuests.map((quest) => (
              <li key={quest.id} className="detail-item-card opacity-85">
                <div className="detail-item-header">
                  <span className="detail-item-title">{quest.title}</span>
                  <span className={`detail-item-tag attr-${quest.attribute}`}>
                    {quest.attribute}
                  </span>
                </div>
                <div className="detail-item-meta">
                  <span className="uppercase text-[0.68rem]">{quest.effort}</span>
                  <span>·</span>
                  <span className="capitalize text-[0.68rem]">{quest.cadence} habit</span>
                </div>
                {quest.notes && (
                  <div className="detail-item-note">
                    <span aria-hidden="true">❧ </span>
                    {quest.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Field Journal Notes Recorded Today */}
      <div className="detail-section">
        <h4 className="detail-section-title">Journal Leaves ({journalNotes.length})</h4>
        {journalNotes.length === 0 ? (
          <p className="detail-empty-notice">No field journal leaves inscribed on this day.</p>
        ) : (
          <ul className="detail-items-list" role="list">
            {journalNotes.map((note) => (
              <li key={note.id} className="detail-item-card">
                {note.title && <span className="detail-item-title">{note.title}</span>}
                <p className="text-xs text-[#B9BEAC] line-clamp-3 my-1 font-['Fraunces'] italic">
                  {note.body}
                </p>
                <span className="text-[0.68rem] text-[#8C9682]">
                  {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
