'use client';

import React from 'react';
import type { GameSnapshot, AttributeId } from '@/game/contracts';
import type { ChronicleEntry } from './contracts';
import { deriveAchievements } from './chronicleAdapter';
import './ChronicleView.css';

export interface ChronicleViewProps {
  initialSnapshot: GameSnapshot;
  entries: ChronicleEntry[];
}

const ATTRIBUTE_COLORS: Record<AttributeId, string> = {
  mind: '#9FBA87',
  body: '#E98A4B',
  will: '#FFD38A',
  craft: '#D9E3B2',
};

export const ChronicleView: React.FC<ChronicleViewProps> = ({
  initialSnapshot,
  entries,
}) => {
  const achievements = deriveAchievements(initialSnapshot, entries);
  const totalCompletions = entries.length;

  return (
    <div className="chronicle-shell">
      {/* Title & Introduction */}
      <div className="chronicle-header">
        <h1 id="chronicle-main-heading">The Chronicle</h1>
        <p>An immutable record of your effort, streaks, and derived milestones.</p>
      </div>

      {/* Summary Metrics */}
      <section aria-label="Chronicle Overview" className="chronicle-stats-grid">
        <div className="chronicle-stat-card">
          <span className="chronicle-stat-label">Current Streak</span>
          <span className="chronicle-stat-value text-[#E98A4B]">
            {initialSnapshot.currentStreak} {initialSnapshot.currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div className="chronicle-stat-card">
          <span className="chronicle-stat-label">Longest Streak</span>
          <span className="chronicle-stat-value text-[#FFD38A]">
            {initialSnapshot.longestStreak} {initialSnapshot.longestStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div className="chronicle-stat-card">
          <span className="chronicle-stat-label">Practices Sealed</span>
          <span className="chronicle-stat-value text-[#9FBA87]">
            {totalCompletions}
          </span>
        </div>

        <div className="chronicle-stat-card">
          <span className="chronicle-stat-label">Total XP</span>
          <span className="chronicle-stat-value text-[#F0E7D3]">
            {initialSnapshot.totalXp}
          </span>
        </div>
      </section>

      {/* Derived Achievements */}
      <section aria-labelledby="achievements-heading" className="chronicle-achievements-section">
        <h2 id="achievements-heading" className="chronicle-section-title">
          Milestones &amp; Achievements
        </h2>

        <div className="achievements-grid">
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className={`achievement-card ${ach.unlocked ? 'is-unlocked' : 'is-locked'}`}
            >
              <div className="space-y-2">
                <div className="achievement-badge-header">
                  <div className="achievement-icon-box" aria-hidden="true">
                    {ach.glyph}
                  </div>
                  <div>
                    <h3 className="achievement-title">{ach.title}</h3>
                  </div>
                </div>

                <p className="achievement-desc">{ach.description}</p>
              </div>

              <div className="pt-2 border-t border-[#2A332A] flex items-center justify-between">
                <span className="achievement-status-tag">
                  {ach.unlocked ? '✓ Unlocked' : 'Locked'}
                </span>

                {ach.unlocked && ach.unlockedAt && (
                  <span className="text-[10px] text-[#B9BEAC]">
                    {new Date(ach.unlockedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Practice Completion History */}
      <section aria-labelledby="history-heading" className="chronicle-history-section">
        <h2 id="history-heading" className="chronicle-section-title">
          Completion Log
        </h2>

        {entries.length === 0 ? (
          <div className="history-empty-box">
            <p className="font-medium text-[#F0E7D3] mb-1">No practices sealed yet.</p>
            <p className="text-xs">
              Complete your daily quests on the Hearth to begin writing your chronicle.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {entries.map((entry) => (
              <article key={entry.id} className="history-row">
                <div>
                  <h3 className="history-title">{entry.title}</h3>
                  <div className="history-meta-badges">
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded capitalize"
                      style={{
                        backgroundColor: `${ATTRIBUTE_COLORS[entry.attribute]}15`,
                        color: ATTRIBUTE_COLORS[entry.attribute],
                        border: `1px solid ${ATTRIBUTE_COLORS[entry.attribute]}40`,
                      }}
                    >
                      {entry.attribute}
                    </span>
                    <span className="text-[10px] text-[#B9BEAC] bg-[#141713] px-2 py-0.5 rounded capitalize border border-[#2A332A]">
                      {entry.effort}
                    </span>
                    <span className="text-[11px] text-[#B9BEAC]">
                      {entry.localDate}
                    </span>
                  </div>
                </div>

                <div className="history-rewards">
                  <span className="text-[#FFD38A] font-semibold">
                    +{entry.xpAwarded} XP
                  </span>
                  <span className="text-[#B9BEAC]">•</span>
                  <span className="text-[#FFD38A]/80">
                    +{entry.sparksAwarded} Sparks
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
