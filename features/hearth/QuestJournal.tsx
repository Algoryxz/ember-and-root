import React from 'react';
import { Button } from '../../components/ui/Button';
import { QuestRow } from './QuestRow';
import type { HearthQuest, Quest } from './contracts';
import './QuestJournal.css';

export interface QuestJournalProps {
  quests: (Quest | HearthQuest)[];
  completedQuestIds?: Set<string>;
  pendingQuestId: string | null;
  errorQuestMap: Record<string, string>;
  isLoading?: boolean;
  generalError?: string | null;
  onCompleteQuest: (questId: string) => void;
  onEditQuest?: (quest: Quest | HearthQuest) => void;
  onRetryQuest?: (questId: string) => void;
  onRetryGeneral?: () => void;
  onOpenCreateDialog?: () => void;
  className?: string;
}

/**
 * QuestJournal — The daily quest journal surface
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * 
 * Invariants:
 * - Clear page hierarchy: TODAY divider -> Quest rows -> Add action
 * - Field journal themed Loading, Empty, and Error states
 * - Semantic HTML (<section>, <h2>, <ul>, <li>)
 * - Accessible keyboard navigation and visible focus
 */
export const QuestJournal: React.FC<QuestJournalProps> = ({
  quests,
  completedQuestIds,
  pendingQuestId,
  errorQuestMap,
  isLoading = false,
  generalError = null,
  onCompleteQuest,
  onEditQuest,
  onRetryQuest,
  onRetryGeneral,
  onOpenCreateDialog,
  className = '',
}) => {
  const hasQuests = quests && quests.length > 0;
  const completedCount = quests.filter(
    (q) => Boolean(completedQuestIds?.has(q.id)) || ('completedForCurrentOccurrence' in q && Boolean(q.completedForCurrentOccurrence))
  ).length;
  const remainingCount = quests.length - completedCount;

  return (
    <section className={`quest-journal-section ${className}`} aria-labelledby="today-heading">
      {/* Ruled Section Divider: TODAY ──────────────────────────────── */}
      <div className="journal-section-divider">
        <div className="journal-divider-title-row">
          <h2 id="today-heading" className="journal-section-title">
            TODAY
          </h2>
          {hasQuests && !isLoading && (
            <span className="journal-status-pill">
              {remainingCount === 0 ? 'All sealed ✓' : `${remainingCount} of ${quests.length} remaining`}
            </span>
          )}
        </div>
        <div className="journal-rule-line" aria-hidden="true" />
      </div>

      {/* Loading State: "The Hearth is waking..." */}
      {isLoading ? (
        <div className="journal-state-card journal-loading-state" role="status">
          <div className="journal-pulse-flame" aria-hidden="true">✦</div>
          <h3 className="journal-state-title">The Hearth is waking...</h3>
          <p className="journal-state-text">
            Gathering today’s inscribed quests and rekindling the coals.
          </p>
        </div>
      ) : generalError ? (
        /* Error State: "Something interrupted the Ember." */
        <div className="journal-state-card journal-error-state" role="alert">
          <div className="journal-error-icon" aria-hidden="true">⚠</div>
          <h3 className="journal-state-title">Something interrupted the Ember.</h3>
          <p className="journal-state-text">{generalError}</p>
          {onRetryGeneral && (
            <Button variant="secondary" onClick={onRetryGeneral}>
              Rekindle &amp; Retry
            </Button>
          )}
        </div>
      ) : !hasQuests ? (
        /* Empty State: "No quests yet." */
        <div className="journal-state-card journal-empty-state">
          <div className="journal-empty-mark" aria-hidden="true">✦</div>
          <h3 className="journal-state-title">No quests yet.</h3>
          <p className="journal-state-text">
            Your journal page lies open, waiting for today’s intention. Every journey of becoming begins with a single declared task.
          </p>
          {onOpenCreateDialog && (
            <Button variant="primary" onClick={onOpenCreateDialog}>
              + Inscribe a quest
            </Button>
          )}
        </div>
      ) : (
        /* Journal Entries List */
        <div className="journal-sheet">
          <ul className="quest-journal-list" role="list">
            {quests.map((quest) => {
              const isConfirmedCompleted =
                Boolean(completedQuestIds?.has(quest.id)) ||
                Boolean('completedForCurrentOccurrence' in quest && quest.completedForCurrentOccurrence);

              return (
                <QuestRow
                  key={quest.id}
                  quest={quest}
                  isCompleted={isConfirmedCompleted}
                  isPending={pendingQuestId === quest.id}
                  errorMessage={errorQuestMap[quest.id] || null}
                  onComplete={onCompleteQuest}
                  onEdit={onEditQuest}
                  onRetry={onRetryQuest}
                />
              );
            })}
          </ul>


          {/* Action Footer: + Add a quest */}
          {onOpenCreateDialog && (
            <div className="journal-actions-row">
              <Button
                variant="secondary"
                onClick={onOpenCreateDialog}
                aria-label="Inscribe a new quest into today's journal"
              >
                + Inscribe a quest
              </Button>
              <span className="journal-subtle-hint" aria-hidden="true">
                What you do today shapes who you become.
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
