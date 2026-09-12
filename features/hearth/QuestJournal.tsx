import React from 'react';
import { Button } from '../../components/ui/Button';
import { QuestRow } from './QuestRow';
import type { AttributeId, HearthQuest, Quest } from './contracts';
import './QuestJournal.css';

export interface QuestJournalProps {
  quests: (Quest | HearthQuest)[];
  currentDateLabel?: string;
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
  onAttributeHover?: (attribute: AttributeId | null) => void;
  className?: string;
}

/**
 * Format current date using product standard locale formatting (e.g., "12 SEPTEMBER")
 * Never hardcodes a fixed date string.
 */
function formatCurrentDate(date = new Date()): string {
  try {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    return `${day} ${month}`;
  } catch {
    return 'CURRENT DAY';
  }
}

/**
 * QuestJournal — The daily practice folio surface
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Botanical Field Journal Sequence
 * 
 * Invariants:
 * - Clear editorial sequence: Dynamic TODAY date -> Numbered practices -> Physical seals
 * - Field journal themed Loading, Empty, and Error states
 * - Semantic HTML (<section>, <h2>, <ol>, <li>)
 * - Accessible keyboard navigation and visible focus
 * - 44px minimum target sizes across all interactive items
 */
export const QuestJournal: React.FC<QuestJournalProps> = ({
  quests,
  currentDateLabel,
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
  onAttributeHover,
  className = '',
}) => {
  const hasQuests = quests && quests.length > 0;
  const completedCount = quests.filter(
    (q) => Boolean(completedQuestIds?.has(q.id)) || ('completedForCurrentOccurrence' in q && Boolean(q.completedForCurrentOccurrence))
  ).length;
  const remainingCount = quests.length - completedCount;

  const todayLabel = currentDateLabel || `TODAY · ${formatCurrentDate()}`;

  return (
    <section className={`quest-journal-section ${className}`} aria-labelledby="today-heading">
      {/* Editorial Folio Header Cluster */}
      <div className="journal-header-cluster">
        <div className="journal-date-marker" aria-hidden="true">
          {todayLabel}
        </div>
        <div className="journal-title-row">
          <h2 id="today-heading" className="journal-title">
            Daily Inscriptions
          </h2>
          {hasQuests && !isLoading && (
            <span className="journal-progress-pill" aria-live="polite">
              {remainingCount === 0 ? 'All sealed ✦' : `${remainingCount} of ${quests.length} open`}
            </span>
          )}
        </div>
        <div className="journal-rule-divider" aria-hidden="true" />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="journal-state-card journal-loading-state" role="status">
          <div className="journal-pulse-glyph" aria-hidden="true">◌</div>
          <h3 className="journal-state-title">The journal is opening...</h3>
          <p className="journal-state-text">
            Gathering today’s inscribed practices and kindling the ember coals.
          </p>
        </div>
      ) : generalError ? (
        /* Error State */
        <div className="journal-state-card journal-error-state" role="alert">
          <div className="journal-error-glyph" aria-hidden="true">⚠</div>
          <h3 className="journal-state-title">Something interrupted the Hearth.</h3>
          <p className="journal-state-text">{generalError}</p>
          {onRetryGeneral && (
            <Button variant="secondary" onClick={onRetryGeneral}>
              Rekindle &amp; Retry
            </Button>
          )}
        </div>
      ) : !hasQuests ? (
        /* Empty State */
        <div className="journal-state-card journal-empty-state">
          <div className="journal-empty-glyph" aria-hidden="true">✦</div>
          <h3 className="journal-state-title">No practices inscribed yet.</h3>
          <p className="journal-state-text">
            Your field journal page lies open, awaiting today’s intention. Every permanent branch begins with a single declared effort.
          </p>
          {onOpenCreateDialog && (
            <Button variant="primary" onClick={onOpenCreateDialog}>
              Inscribe first practice
            </Button>
          )}
        </div>
      ) : (
        /* Populated Sequential Field Entries */
        <div className="journal-sequence-wrapper">
          <ol className="journal-sequence-list" aria-label="Today’s inscribed practices">
            {quests.map((quest, idx) => {
              const isCompleted = Boolean(
                completedQuestIds?.has(quest.id) ||
                  ('completedForCurrentOccurrence' in quest && quest.completedForCurrentOccurrence)
              );
              const isPending = pendingQuestId === quest.id;
              const errorMessage = errorQuestMap[quest.id] || null;

              return (
                <QuestRow
                  key={quest.id}
                  quest={quest}
                  index={idx}
                  isCompleted={isCompleted}
                  isPending={isPending}
                  errorMessage={errorMessage}
                  onComplete={onCompleteQuest}
                  onEdit={onEditQuest}
                  onRetry={onRetryQuest}
                  onAttributeHover={onAttributeHover}
                />
              );
            })}
          </ol>

          {/* Action to inscribe additional practices */}
          {onOpenCreateDialog && (
            <div className="journal-inscribe-row">
              <button
                type="button"
                className="journal-inscribe-btn"
                onClick={onOpenCreateDialog}
                aria-label="Inscribe new daily practice"
              >
                <span className="inscribe-btn-mark" aria-hidden="true">+</span>
                <span className="inscribe-btn-text">Inscribe new daily practice</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
