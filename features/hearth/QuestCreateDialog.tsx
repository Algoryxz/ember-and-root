import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { AttributeId, Cadence, Effort, Quest } from './contracts';
import './QuestCreateDialog.css';

export interface QuestCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateQuest: (quest: Omit<Quest, 'id' | 'userId' | 'version' | 'deletedAt' | 'createdAt' | 'updatedAt' | 'trialId'>) => void;
}

/**
 * QuestCreateDialog — Accessible dialog for crafting new journal tasks
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title cannot be blank.');
      return;
    }
    if (trimmedTitle.length > 120) {
      setError('Title must be 120 characters or fewer.');
      return;
    }

    onCreateQuest({
      title: trimmedTitle,
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
      aria-labelledby="dialog-title"
      onClick={onClose}
    >
      <div className="dialog-window" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 id="dialog-title" className="dialog-title">Declare a Quest</h2>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quest-form">
          <div className="form-field">
            <label htmlFor="quest-title-input" className="form-label">
              Quest Title
            </label>
            <input
              id="quest-title-input"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read two chapters of literature"
              maxLength={120}
              required
              autoFocus
            />
            {error && <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>{error}</span>}
          </div>

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
              <option value="mind">Mind (Intellect, Study, Curiosity)</option>
              <option value="body">Body (Movement, Endurance, Physical)</option>
              <option value="will">Will (Discipline, Focus, Courage)</option>
              <option value="craft">Craft (Building, Artistry, Creating)</option>
            </select>
          </div>

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
              <option value="quick">Quick (10 XP, ~15 mins)</option>
              <option value="standard">Standard (20 XP, ~45 mins)</option>
              <option value="deep">Deep (35 XP, ~90+ mins)</option>
            </select>
          </div>

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
              <option value="daily">Daily Habit</option>
              <option value="once">Once (Single milestone)</option>
            </select>
          </div>

          <div className="dialog-actions">
            <Button variant="ghost" onClick={onClose}>
              Cancel
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
