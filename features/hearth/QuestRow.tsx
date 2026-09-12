import React from 'react';
import { Button } from '../../components/ui/Button';
import type { HearthQuest, Quest } from './contracts';
import './QuestRow.css';

export interface QuestRowProps {
  quest: Quest | HearthQuest;
  isCompleted?: boolean;
  isPending?: boolean;
  errorMessage?: string | null;
  onComplete: (questId: string) => void;
  onRetry?: (questId: string) => void;
}

/**
 * QuestRow — Individual quest entry in the illuminated field journal
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal (ruled lines, ink stamps, not SaaS cards)
 * 
 * Invariants:
 * - Clear states: idle, focused, completing/pending, confirmed, error, retry
 * - Semantic HTML <li> with accessible labels
 * - Min 44px interaction targets
 * - NO local progression or XP calculation
 */
export const QuestRow: React.FC<QuestRowProps> = ({
  quest,
  isCompleted = false,
  isPending = false,
  errorMessage = null,
  onComplete,
  onRetry,
}) => {
  const { id, title, attribute, effort, cadence } = quest;

  const rowClasses = [
    'quest-journal-entry',
    `entry-attr-${attribute}`,
    isCompleted ? 'is-sealed' : '',
    isPending ? 'is-pending' : '',
    errorMessage ? 'has-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleAction = () => {
    if (!isCompleted && !isPending) {
      onComplete(id);
    }
  };

  // Human-friendly cadence text
  const cadenceLabel = cadence === 'daily' ? 'Daily habit' : 'Single milestone';

  return (
    <li className={rowClasses}>
      {/* Left field journal ink margin stamp */}
      <div className="entry-ink-margin" aria-hidden="true" />

      <div className="entry-content">
        <div className="entry-header">
          <span className="entry-title">{title}</span>
        </div>

        <div className="entry-meta">
          <span className={`entry-tag tag-${attribute}`}>
            {attribute}
          </span>
          <span className="entry-tag tag-effort">
            {effort} effort
          </span>
          <span className="entry-cadence">
            {cadenceLabel}
          </span>
        </div>

        {/* Error notification and retry action */}
        {errorMessage && (
          <div className="entry-error-alert" role="alert">
            <span className="entry-error-icon" aria-hidden="true">⚠</span>
            <span className="entry-error-text">{errorMessage}</span>
            {onRetry && (
              <button
                type="button"
                className="entry-retry-button"
                onClick={() => onRetry(id)}
                aria-label={`Retry completing quest: ${title}`}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="entry-action-cell">
        <Button
          variant="completion"
          pending={isPending}
          completed={isCompleted}
          pendingText="Sealing..."
          onClick={handleAction}
          aria-label={
            isCompleted
              ? `Quest already sealed: ${title}`
              : `Seal quest: ${title}`
          }
        >
          {isCompleted ? 'Sealed ✓' : 'Seal quest'}
        </Button>
      </div>
    </li>
  );
};
