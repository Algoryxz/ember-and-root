import React from 'react';
import { Button } from '../../components/ui/Button';
import type { Quest } from './contracts';
import './QuestRow.css';

export interface QuestRowProps {
  quest: Quest;
  isCompleted?: boolean;
  isPending?: boolean;
  errorMessage?: string | null;
  onComplete: (questId: string) => void;
  onRetry?: (questId: string) => void;
}

/**
 * QuestRow — Individual quest entry in the illuminated field journal
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
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
    'quest-row',
    isCompleted ? 'is-completed' : '',
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

  return (
    <li className={rowClasses}>
      <div className="quest-main">
        <span className="quest-title">{title}</span>

        <div className="quest-metadata">
          <span className={`quest-badge quest-attr-${attribute}`}>
            {attribute}
          </span>
          <span className="quest-badge quest-effort-badge">
            {effort} effort
          </span>
          <span className="quest-cadence-badge">
            • {cadence}
          </span>
        </div>

        {errorMessage && (
          <div className="quest-error-notice" role="alert">
            <span>⚠ {errorMessage}</span>
            {onRetry && (
              <button
                type="button"
                className="quest-retry-btn"
                onClick={() => onRetry(id)}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="quest-action-area">
        <Button
          variant="completion"
          pending={isPending}
          completed={isCompleted}
          pendingText="Sealing..."
          onClick={handleAction}
          aria-label={isCompleted ? `Quest completed: ${title}` : `Complete quest: ${title}`}
        >
          {isCompleted ? 'Completed ✓' : 'Complete quest'}
        </Button>
      </div>
    </li>
  );
};
