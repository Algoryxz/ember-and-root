import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { AttributeId, Cadence, Effort, HearthQuest, Quest } from './contracts';
import './QuestEditDialog.css';

export interface QuestEditDialogProps {
  isOpen: boolean;
  quest: Quest | HearthQuest | null;
  onClose: () => void;
  onUpdateQuest: (
    questId: string,
    updates: {
      title: string;
      attribute: AttributeId;
      effort: Effort;
      cadence: Cadence;
    }
  ) => Promise<void> | void;
}

/**
 * QuestEditDialog — Accessible field-journal dialog for editing existing quests
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * 
 * Invariants:
 * - Field journal atmosphere (not a corporate SaaS modal)
 * - Accessible dialog semantics (role="dialog", aria-modal="true", Escape key)
 * - Focus trapping and sensible autofocus on the title field
 * - Pre-populates existing quest values faithfully
 * - Minimum 44px touch targets on mobile & desktop
 * - Client-side validation: trims whitespace, requires non-empty title (<= 120 chars)
 * - Async authoritative mutation via adapter with pending state, error persistence, and retry
 * - NO local XP / progression calculations
 */
export const QuestEditDialog: React.FC<QuestEditDialogProps> = ({
  isOpen,
  quest,
  onClose,
  onUpdateQuest,
}) => {
  const [title, setTitle] = useState('');
  const [attribute, setAttribute] = useState<AttributeId>('mind');
  const [effort, setEffort] = useState<Effort>('standard');
  const [cadence, setCadence] = useState<Cadence>('daily');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state with incoming quest whenever the dialog opens or quest changes
  useEffect(() => {
    if (quest && isOpen) {
      setTitle(quest.title);
      setAttribute(quest.attribute);
      setEffort(quest.effort);
      setCadence(quest.cadence);
      setError(null);
      setIsSubmitting(false);
    }
  }, [quest, isOpen]);

  // Accessibility: Escape key handling and focus management (focus trap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }

      // Simple focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Autofocus input
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !quest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = title.trim();

    if (!trimmed) {
      setError('A quest title is required to update the journal entry.');
      return;
    }

    if (trimmed.length > 120) {
      setError('Quest titles must be concise (120 characters or fewer).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdateQuest(quest.id, {
        title: trimmed,
        attribute,
        effort,
        cadence,
      });

      setError(null);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not update quest in the journal. Please retry.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-quest-title"
      aria-describedby="edit-quest-desc"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="dialog-window"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Field Journal Header */}
        <div className="dialog-header">
          <div>
            <h2 id="edit-quest-title" className="dialog-title">
              Revise Inscription
            </h2>
            <p id="edit-quest-desc" className="dialog-subtitle">
              Refine your declaration. Adjust the scope, discipline, or rhythm of your task.
            </p>
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close revision dialog"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quest-edit-form">
          {/* Quest Title */}
          <div className="form-field">
            <label htmlFor="edit-quest-title-input" className="form-label">
              Quest Title <span className="label-required">*</span>
            </label>
            <input
              ref={inputRef}
              id="edit-quest-title-input"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Read two chapters of classical literature"
              maxLength={120}
              required
              disabled={isSubmitting}
            />
            {error && (
              <span className="form-error-text" role="alert">
                ⚠ {error}
              </span>
            )}
          </div>

          {/* Attribute Domain */}
          <div className="form-field">
            <label htmlFor="edit-quest-attribute-select" className="form-label">
              Attribute Domain
            </label>
            <select
              id="edit-quest-attribute-select"
              className="form-select"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value as AttributeId)}
              disabled={isSubmitting}
            >
              <option value="mind">Mind — Intellect, study, deep curiosity</option>
              <option value="body">Body — Movement, endurance, physical vitality</option>
              <option value="will">Will — Discipline, focus, courageous action</option>
              <option value="craft">Craft — Artistry, building, practical creation</option>
            </select>
          </div>

          {/* Effort Level */}
          <div className="form-field">
            <label htmlFor="edit-quest-effort-select" className="form-label">
              Effort Level
            </label>
            <select
              id="edit-quest-effort-select"
              className="form-select"
              value={effort}
              onChange={(e) => setEffort(e.target.value as Effort)}
              disabled={isSubmitting}
            >
              <option value="quick">Quick — ~15 mins (10 XP reference)</option>
              <option value="standard">Standard — ~45 mins (20 XP reference)</option>
              <option value="deep">Deep — ~90+ mins (35 XP reference)</option>
            </select>
          </div>

          {/* Cadence */}
          <div className="form-field">
            <label htmlFor="edit-quest-cadence-select" className="form-label">
              Cadence
            </label>
            <select
              id="edit-quest-cadence-select"
              className="form-select"
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Cadence)}
              disabled={isSubmitting}
            >
              <option value="daily">Daily Habit (Returns each day)</option>
              <option value="once">Single Milestone (One-time accomplishment)</option>
            </select>
          </div>

          {/* Dialog Action Buttons */}
          <div className="dialog-actions">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Discard Changes
            </Button>
            <Button
              variant="primary"
              type="submit"
              pending={isSubmitting}
              pendingText="Saving..."
            >
              Save Revision
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
