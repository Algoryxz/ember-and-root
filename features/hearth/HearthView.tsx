import React, { useState } from 'react';
import {
  INITIAL_FIXTURE_SNAPSHOT,
  simulateServerCompletion,
  type AttributeId,
  type GameSnapshot,
  type MutationEvent,
  type Quest,
} from './contracts';
import { EmberDisplay } from './EmberDisplay';
import { HearthRootPreview } from './HearthRootPreview';
import { QuestJournal } from './QuestJournal';
import { QuestCreateDialog } from './QuestCreateDialog';
import { RewardSequence } from './RewardSequence';
import './HearthView.css';

export interface HearthViewProps {
  initialSnapshot?: GameSnapshot;
  className?: string;
}

/**
 * HearthView — Top-level Hearth experience
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * 
 * Desktop composition: 1440px (~40% Left Journal, ~60% Right Ember/Root scene)
 * Mobile composition: 320px/375px/390px stacked column with safe-area spacing
 */
export const HearthView: React.FC<HearthViewProps> = ({
  initialSnapshot = INITIAL_FIXTURE_SNAPSHOT,
  className = '',
}) => {
  // Authoritative snapshot state (replaces local copy after confirmed server response)
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [quests, setQuests] = useState<Quest[]>(initialSnapshot.quests || []);

  // In-flight mutation & error tracking
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [pendingQuestId, setPendingQuestId] = useState<string | null>(null);
  const [errorQuestMap, setErrorQuestMap] = useState<Record<string, string>>({});

  // Progression & Reward Choreography states
  const [activeEvent, setActiveEvent] = useState<MutationEvent | null>(null);
  const [activeQuestTitle, setActiveQuestTitle] = useState<string>('Quest');
  const [highlightAttribute, setHighlightAttribute] = useState<AttributeId | null>(null);
  const [isEmberRelit, setIsEmberRelit] = useState<boolean>(false);
  const [showPathReadyNotice, setShowPathReadyNotice] = useState<boolean>(false);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);

  // Test toggle to simulate failure and verify the retry flow
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Core Quest Completion Flow (Strictly follows docs/APP_FLOW.md § 8 & 9)
  // --------------------------------------------------------------------------
  const handleCompleteQuest = async (questId: string) => {
    if (pendingQuestId || completedQuestIds.has(questId)) return;

    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    // 1. Immediately enter pending state & clear error
    setPendingQuestId(questId);
    setErrorQuestMap((prev) => {
      const next = { ...prev };
      delete next[questId];
      return next;
    });

    try {
      // 2. Call authoritative server simulation
      const result = await simulateServerCompletion(snapshot, questId, simulateFailure);

      // 3. Apply confirmed authoritative server result
      setCompletedQuestIds((prev) => new Set([...prev, questId]));
      setSnapshot(result.snapshot);

      // 4. Trigger reward sequence choreography
      setActiveQuestTitle(quest.title);
      setActiveEvent(result.event);
      setHighlightAttribute(quest.attribute);

      if (result.event.emberRelit) {
        setIsEmberRelit(true);
        setTimeout(() => setIsEmberRelit(false), 900);
      }

      if (result.event.specializationAvailable) {
        setShowPathReadyNotice(true);
      }
    } catch (err: unknown) {
      // Failure state: row returns to active state, inline retry error shown
      const message =
        err instanceof Error ? err.message : 'Could not complete quest. Try again.';
      setErrorQuestMap((prev) => ({ ...prev, [questId]: message }));
    } finally {
      setPendingQuestId(null);
    }
  };

  const handleRetryQuest = (questId: string) => {
    handleCompleteQuest(questId);
  };

  const handleCreateQuest = (
    newQuestData: Omit<Quest, 'id' | 'userId' | 'version' | 'deletedAt' | 'createdAt' | 'updatedAt' | 'trialId'>
  ) => {
    const newQuest: Quest = {
      ...newQuestData,
      id: `q-local-${Date.now()}`,
      userId: snapshot.userId,
      version: 1,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trialId: null,
    };
    setQuests((prev) => [newQuest, ...prev]);
  };

  return (
    <div className={`hearth-wrapper ${className}`}>
      {/* Accessible skip link */}
      <a href="#journal-heading" className="skip-link">
        Skip to Quest Journal
      </a>

      {/* Top Navigation Strip */}
      <header className="hearth-nav-strip">
        <div className="hearth-brand">
          <div className="hearth-brand-mark" aria-hidden="true" />
          <h1 className="hearth-brand-title">Ember &amp; Root</h1>
        </div>

        <nav aria-label="Primary destinations">
          <ul className="hearth-nav-links">
            <li className="hearth-nav-item is-active">
              <a href="#hearth" aria-current="page">
                Hearth
              </a>
            </li>
            <li className="hearth-nav-item">
              <a href="#root">Root</a>
            </li>
            <li className="hearth-nav-item">
              <a href="#satchel">Satchel</a>
            </li>
            <li className="hearth-nav-item">
              <a href="#chronicle">Chronicle</a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Status Strip: Level · Sparks · Streak */}
      <div className="hearth-status-strip" role="region" aria-label="Character Status">
        <div className="status-stat">
          <span className="status-label">Level:</span>
          <span className="status-value">{snapshot.level}</span>
        </div>
        <div className="status-stat">
          <span className="status-icon status-sparks-icon" aria-hidden="true">
            ✦
          </span>
          <span className="status-label">Sparks:</span>
          <span className="status-value">{snapshot.sparksBalance}</span>
        </div>
        <div className="status-stat">
          <span className="status-icon status-streak-icon" aria-hidden="true">
            🔥
          </span>
          <span className="status-label">Streak:</span>
          <span className="status-value">{snapshot.currentStreak} days</span>
        </div>

        {/* Demo inspection toggle for failure verification */}
        <div className="hearth-demo-controls" style={{ marginLeft: 'auto' }}>
          <label className="hearth-demo-toggle">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
            />
            <span>Simulate server failure (for retry testing)</span>
          </label>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="hearth-main-content">
        {/* Left Column: Journal (~40% on desktop) */}
        <div className="hearth-left-column">
          <QuestJournal
            quests={quests}
            completedQuestIds={completedQuestIds}
            pendingQuestId={pendingQuestId}
            errorQuestMap={errorQuestMap}
            onCompleteQuest={handleCompleteQuest}
            onRetryQuest={handleRetryQuest}
            onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
          />
        </div>

        {/* Right Column: Ember scene & Root preview (~60% on desktop) */}
        <div className="hearth-right-column">
          {/* Reward Sequence notices and announcements */}
          <RewardSequence
            activeEvent={activeEvent}
            questTitle={activeQuestTitle}
            showPathReadyNotice={showPathReadyNotice}
            onDismissPathNotice={() => setShowPathReadyNotice(false)}
            onSequenceComplete={() => {
              setActiveEvent(null);
              setHighlightAttribute(null);
            }}
          />

          {/* Living Ember Momentum Visual */}
          <EmberDisplay
            state={snapshot.emberState}
            isRelit={isEmberRelit}
          />

          {/* Compact Root Advancement Preview */}
          <HearthRootPreview
            branches={snapshot.branches}
            highlightAttribute={highlightAttribute}
          />
        </div>
      </main>

      {/* Mobile Safe Area Padding */}
      <div className="mobile-safe-bottom" aria-hidden="true" />

      {/* Quest Creation Dialog */}
      <QuestCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateQuest={handleCreateQuest}
      />
    </div>
  );
};
