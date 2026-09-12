import React from 'react';
import { Button } from '../../components/ui/Button';
import { QuestRow } from './QuestRow';
import type { Quest } from './contracts';
import './QuestJournal.css';

export interface QuestJournalProps {
  quests: Quest[];
  completedQuestIds: Set<string>;
  pendingQuestId: string | null;
  errorQuestMap: Record<string, string>;
  onCompleteQuest: (questId: string) => void;
  onRetryQuest?: (questId: string) => void;
  onOpenCreateDialog?: () => void;
  className?: string;
}

/**
 * QuestJournal — The daily quest journal surface
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 */
export const QuestJournal: React.FC<QuestJournalProps> = ({
  quests,
  completedQuestIds,
  pendingQuestId,
  errorQuestMap,
  onCompleteQuest,
  onRetryQuest,
  onOpenCreateDialog,
  className = '',
}) => {
  const hasQuests = quests && quests.length > 0;

  return (
    <section className={`quest-journal-container ${className}`} aria-labelledby="journal-heading">
      <div className="quest-journal-header">
        <h2 id="journal-heading" className="quest-journal-heading">
          Today's Journal
          {hasQuests && <span className="quest-count-badge">{quests.length}</span>}
        </h2>

        {hasQuests && onOpenCreateDialog && (
          <Button
            variant="secondary"
            onClick={onOpenCreateDialog}
            aria-label="Create a new quest"
          >
            + New quest
          </Button>
        )}
      </div>

      {!hasQuests ? (
        <div className="quest-empty-state">
          <h3 className="quest-empty-title">Your journal is quiet.</h3>
          <p className="quest-empty-subtitle">
            No quests written for today yet. Every journey of becoming begins with a single declared task.
          </p>
          {onOpenCreateDialog && (
            <Button variant="primary" onClick={onOpenCreateDialog}>
              Create your first quest
            </Button>
          )}
        </div>
      ) : (
        <ul className="quest-journal-list">
          {quests.map((quest) => (
            <QuestRow
              key={quest.id}
              quest={quest}
              isCompleted={completedQuestIds.has(quest.id)}
              isPending={pendingQuestId === quest.id}
              errorMessage={errorQuestMap[quest.id] || null}
              onComplete={onCompleteQuest}
              onRetry={onRetryQuest}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
