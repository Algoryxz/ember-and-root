import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { AttributeId, Cadence, Effort, Quest } from './contracts';
import './QuestCreateDialog.css';

export interface QuestCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateQuest: (quest: Omit<Quest, 'id' | 'userId' | 'version' | 'deletedAt' | 'createdAt' | 'updatedAt' | 'trialId'>) => void;
}

/**
 * QuestCreateDialog — Accessible field-journal modal for inscribing new tasks
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * 
 * Invariants:
 * - Field journal atmosphere (not a corporate SaaS form)
 * - Accessible dialog semantics (role="dialog", aria-modal="true", Escape key)
 * - Focus trapping and sensible autofocus
 * - Minimum 44px touch targets
 * - NO local XP / progression calculations
 */
export const QuestCreateDialog: React.FC<QuestCreateDialogProps> = ({
  isOpen,
  onClose,
  onCreateQuest,
}) => {
  const [title, setTitle] = useState('');
  const [attribute, setAttribute] = useState<AttributeId>('mind');
  const [effort, setEffort] = useState<Effort>('standard');
  const [cadence, setCadence] = useState<Cadence>('daily');
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Accessibility: Escape key handling and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();

    if (!trimmed) {
      setError('A quest title is required before it can be inscribed.');
      return;
    }

    if (trimmed.length > 120) {
      setError('Quest titles must be concise (120 characters or fewer).');
      return;
    }

    onCreateQuest({
      title: trimmed,
      attribute,
      effort,
      cadence,
    });

    setTitle('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inscribe-title"
      aria-describedby="inscribe-desc"
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
            <h2 id="inscribe-title" className="dialog-title">
              Inscribe a Quest
            </h2>
            <p id="inscribe-desc" className="dialog-subtitle">
              Declare today’s intention. What you do becomes who you are.
            </p>
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close inscription dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quest-inscribe-form">
          {/* Quest Title */}
          <div className="form-field">
            <label htmlFor="quest-title-input" className="form-label">
              Quest Title <span className="label-required">*</span>
            </label>
            <input
              ref={inputRef}
              id="quest-title-input"
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
            />
            {error && (
              <span className="form-error-text" role="alert">
                ⚠ {error}
              </span>
            )}
          </div>

          {/* Attribute Domain */}
          <div className="form-field">
            <label htmlFor="quest-attribute-select" className="form-label">
              Attribute Domain
            </label>
            <select
              id="quest-attribute-select"
              className="form-select"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value as AttributeId)}
            >
              <option value="mind">Mind — Intellect, study, deep curiosity</option>
              <option value="body">Body — Movement, endurance, physical vitality</option>
              <option value="will">Will — Discipline, focus, courageous action</option>
              <option value="craft">Craft — Artistry, building, practical creation</option>
            </select>
          </div>

          {/* Effort Level */}
          <div className="form-field">
            <label htmlFor="quest-effort-select" className="form-label">
              Effort Level
            </label>
            <select
              id="quest-effort-select"
              className="form-select"
              value={effort}
              onChange={(e) => setEffort(e.target.value as Effort)}
            >
              <option value="quick">Quick — ~15 mins (10 XP reference)</option>
              <option value="standard">Standard — ~45 mins (20 XP reference)</option>
              <option value="deep">Deep — ~90+ mins (35 XP reference)</option>
            </select>
          </div>

          {/* Cadence */}
          <div className="form-field">
            <label htmlFor="quest-cadence-select" className="form-label">
              Cadence
            </label>
            <select
              id="quest-cadence-select"
              className="form-select"
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Cadence)}
            >
              <option value="daily">Daily Habit (Returns each day)</option>
              <option value="once">Single Milestone (One-time accomplishment)</option>
            </select>
          </div>

          {/* Dialog Action Buttons */}
          <div className="dialog-actions">
            <Button variant="ghost" onClick={onClose}>
              Discard
            </Button>
            <Button variant="primary" type="submit">
              Inscribe in Journal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
