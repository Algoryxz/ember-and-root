import React from 'react';
import type { AttributeId, HearthQuest, Quest } from './contracts';
import './QuestRow.css';

export interface QuestRowProps {
  quest: Quest | HearthQuest;
  index?: number;
  isCompleted?: boolean;
  isPending?: boolean;
  errorMessage?: string | null;
  onComplete: (questId: string) => void;
  onBeginFocus?: (quest: Quest | HearthQuest) => void;
  onEdit?: (quest: Quest | HearthQuest) => void;
  onRetry?: (questId: string) => void;
  onUpdateNotes?: (questId: string, notes: string | null) => Promise<void> | void;
  onAttributeHover?: (attribute: AttributeId | null) => void;
}

/**
 * QuestRow — Journal entry in the botanical field journal
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Botanical Field Journal
 * 
 * Invariants:
 * - Clear states: resting, focused, pending/sealing, sealed, error, retry
 * - Semantic HTML <li> with accessible labels
 * - Min 44px interaction targets
 * - Subtle field-journal quill affordance for editing
 * - Tactile physical seal impression button for completion
 * - Quest -> Root resonance on hover/focus (presentation only)
 * - Retains selectors for RewardSequence (.quest-row, data-quest-id, .is-completed)
 * - NO local progression or XP calculation
 */
export const QuestRow: React.FC<QuestRowProps> = ({
  quest,
  index = 0,
  isCompleted = false,
  isPending = false,
  errorMessage = null,
  onComplete,
  onBeginFocus,
  onEdit,
  onRetry,
  onUpdateNotes,
  onAttributeHover,
}) => {
  const { id, title, attribute, effort, cadence } = quest;
  const [isEditingNote, setIsEditingNote] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState(quest.notes || '');
  const [isSavingNote, setIsSavingNote] = React.useState(false);

  React.useEffect(() => {
    setNoteDraft(quest.notes || '');
  }, [quest.notes]);

  const rowClasses = [
    'quest-journal-entry',
    'quest-row', // Crucial for RewardSequence element anchoring
    `entry-attr-${attribute}`,
    isCompleted ? 'is-sealed is-completed' : '',
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit && !isPending) {
      onEdit(quest);
    }
  };

  const handleMouseEnter = () => {
    onAttributeHover?.(attribute as AttributeId);
  };

  const handleMouseLeave = () => {
    onAttributeHover?.(null);
  };

  const handleFocus = () => {
    onAttributeHover?.(attribute as AttributeId);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onAttributeHover?.(null);
    }
  };

  const entryNumber = String(index + 1).padStart(2, '0');
  const cadenceLabel = cadence === 'daily' ? 'Daily habit' : 'Milestone';

  return (
    <li
      className={rowClasses}
      data-quest-id={id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Editorial Number Gutter */}
      <div className="entry-gutter" aria-hidden="true">
        <span className="entry-index">{entryNumber}</span>
        <span className="entry-filament-indicator" />
      </div>

      {/* Main Journal Entry Body */}
      <div className="entry-body">
        <div className="entry-header-row">
          <span className="entry-title">{title}</span>
          
          <div className="entry-header-actions">
            {/* Field-journal marginalia note toggle button */}
            {!isCompleted && onUpdateNotes && (
              <button
                type="button"
                className={`entry-note-btn ${quest.notes ? 'has-note' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNote((prev) => !prev);
                }}
                disabled={isPending}
                aria-label={quest.notes ? `Edit note for ${title}` : `Add note to ${title}`}
                title={quest.notes ? 'Edit field note' : 'Add field note'}
              >
                <span className="entry-note-icon" aria-hidden="true">🗎</span>
                <span className="entry-note-btn-label">{quest.notes ? 'Note' : '+Note'}</span>
              </button>
            )}

            {/* Subtle field-journal quill edit affordance */}
            {onEdit && !isCompleted && (
              <button
                type="button"
                className="entry-edit-btn"
                onClick={handleEdit}
                disabled={isPending}
                aria-label={`Edit practice: ${title}`}
                title="Edit practice"
              >
                <span className="entry-edit-icon" aria-hidden="true">✎</span>
              </button>
            )}
          </div>
        </div>

        <div className="entry-meta-row">
          <span className={`entry-attribute-tag attr-${attribute}`}>
            {attribute.toUpperCase()}
          </span>
          <span className="entry-meta-dot" aria-hidden="true">·</span>
          <span className="entry-effort-tag">
            {effort.toUpperCase()}
          </span>
          <span className="entry-meta-dot" aria-hidden="true">·</span>
          <span className="entry-cadence-label">
            {cadenceLabel}
          </span>
        </div>

        {/* Inline Note Editor */}
        {isEditingNote && !isCompleted && (
          <div className="entry-note-inline-editor" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value.slice(0, 1000))}
              placeholder="Record field notes or context (max 1000 chars)..."
              className="entry-note-textarea"
              rows={2}
              maxLength={1000}
              aria-label={`Note for ${title}`}
            />
            <div className="entry-note-editor-footer">
              <span className="entry-note-char-count">{1000 - noteDraft.length} chars left</span>
              <div className="entry-note-editor-btns">
                <button
                  type="button"
                  className="entry-note-cancel-btn"
                  onClick={() => {
                    setNoteDraft(quest.notes || '');
                    setIsEditingNote(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="entry-note-save-btn"
                  disabled={isSavingNote}
                  onClick={async () => {
                    setIsSavingNote(true);
                    try {
                      await onUpdateNotes?.(id, noteDraft.trim() || null);
                      setIsEditingNote(false);
                    } finally {
                      setIsSavingNote(false);
                    }
                  }}
                >
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Marginalia Note Display */}
        {!isEditingNote && quest.notes && (
          <div
            className="entry-note-display"
            onClick={(e) => {
              if (!isCompleted && onUpdateNotes) {
                e.stopPropagation();
                setIsEditingNote(true);
              }
            }}
            title={!isCompleted && onUpdateNotes ? 'Click to edit note' : undefined}
          >
            <span className="entry-note-quill" aria-hidden="true">❧</span>
            <span className="entry-note-text">{quest.notes}</span>
          </div>
        )}

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
                aria-label={`Retry sealing practice: ${title}`}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editorial Connecting Rule Line */}
      <div className="entry-rule-line" aria-hidden="true" />

      {/* Physical Tactile Seal & Focus Ritual Actions */}
      <div className="entry-seal-affordance">
        {onBeginFocus && !isCompleted && !isPending && (
          <button
            type="button"
            className="entry-ritual-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBeginFocus(quest);
            }}
            aria-label={`Begin focus ritual for practice: ${title}`}
            title="Begin Focus Ritual"
          >
            <span className="ritual-btn-mark" aria-hidden="true">✦</span>
            <span className="ritual-btn-label">Ritual</span>
          </button>
        )}

        <button
          type="button"
          className={`entry-seal-btn btn-completion ${isCompleted ? 'is-sealed is-completed' : ''} ${isPending ? 'is-pending' : ''}`}
          onClick={handleAction}
          disabled={isCompleted || isPending}
          aria-label={
            isCompleted
              ? `Practice sealed: ${title}`
              : isPending
              ? `Sealing practice: ${title}`
              : `Apply seal to practice: ${title}`
          }
        >
          <span className="seal-btn-mark" aria-hidden="true">
            {isCompleted ? '✦' : isPending ? '◌' : '◎'}
          </span>
          <span className="seal-btn-label">
            {isCompleted ? 'Sealed' : isPending ? 'Sealing...' : 'Seal'}
          </span>
        </button>
      </div>
    </li>
  );
};
