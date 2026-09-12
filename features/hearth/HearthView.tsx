import React, { useState } from 'react';
import {
  DEMO_SNAPSHOT,
  simulateServerCompletion,
  type AttributeId,
  type GameSnapshot,
  type HearthQuest,
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
 * Hierarchy:
 * 1. App Shell Nav & Character Status Strip
 * 2. HEARTH Title & "Today is where the path begins."
 * 3. Living Ember Momentum & Compact Root Advancement Preview
 * 4. TODAY's Inscribed Quests Journal
 * 5. Quest Actions & Inscription Modal
 * 6. Non-blocking Reward & Progression Notices
 */
export const HearthView: React.FC<HearthViewProps> = ({
  initialSnapshot = DEMO_SNAPSHOT,
  className = '',
}) => {
  // Authoritative snapshot state (replaces local state upon confirmed server response)
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);

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

  // Failure simulation toggle (for QA and manual verification of retry behavior)
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Core Quest Completion Flow (Strictly follows docs/APP_FLOW.md § 8 & 9)
  // --------------------------------------------------------------------------
  const handleCompleteQuest = async (questId: string) => {
    if (pendingQuestId) return;

    const quests = snapshot.quests || [];
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    // Check if already completed
    const isAlreadyCompleted =
      completedQuestIds.has(questId) || quest.completedForCurrentOccurrence;
    if (isAlreadyCompleted) return;

    // 1. Immediately enter pending state & clear previous error for this quest
    setPendingQuestId(questId);
    setErrorQuestMap((prev) => {
      const next = { ...prev };
      delete next[questId];
      return next;
    });

    try {
      // 2. Call authoritative server mutation / simulation
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
        err instanceof Error ? err.message : 'Could not seal quest. Try again.';
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
    const todayKey = new Date().toISOString().split('T')[0];
    const newQuest: HearthQuest = {
      ...newQuestData,
      id: `q-inscribed-${Date.now()}`,
      userId: snapshot.userId,
      version: 1,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trialId: null,
      currentOccurrenceKey: todayKey,
      completedForCurrentOccurrence: false,
    };

    setSnapshot((prev) => ({
      ...prev,
      quests: [newQuest, ...(prev.quests || [])],
    }));
  };

  const quests = snapshot.quests || [];

  return (
    <div className={`hearth-shell ${className}`}>
      {/* Accessible skip link */}
      <a href="#today-heading" className="skip-link">
        Skip to Today’s Journal
      </a>

      {/* App Shell Navigation Bar */}
      <header className="hearth-app-header">
        <div className="hearth-header-inner">
          <div className="hearth-brand">
            <div className="hearth-brand-flame" aria-hidden="true" />
            <span className="hearth-brand-name">Ember &amp; Root</span>
          </div>

          <nav aria-label="Primary game destinations" className="hearth-main-nav">
            <ul className="hearth-nav-list">
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

          {/* Character Status Strip */}
          <div className="hearth-status-strip" role="region" aria-label="Character Status">
            <div className="status-item">
              <span className="status-label">Level</span>
              <span className="status-value">{snapshot.level}</span>
            </div>
            <div className="status-divider" aria-hidden="true">·</div>
            <div className="status-item">
              <span className="status-icon sparks-icon" aria-hidden="true">✦</span>
              <span className="status-label">Sparks</span>
              <span className="status-value">{snapshot.sparksBalance}</span>
            </div>
            <div className="status-divider" aria-hidden="true">·</div>
            <div className="status-item">
              <span className="status-icon streak-icon" aria-hidden="true">🔥</span>
              <span className="status-label">Streak</span>
              <span className="status-value">{snapshot.currentStreak}d</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Field Journal Canvas */}
      <main id="hearth-main" className="hearth-canvas">
        {/* Hearth Hero Banner */}
        <section className="hearth-hero-section" aria-labelledby="hearth-title">
          <h1 id="hearth-title" className="hearth-hero-title">
            HEARTH
          </h1>
          <p className="hearth-hero-subtitle">
            Today is where the path begins.
          </p>
        </section>

        {/* Transient Reward & Level Notices */}
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

        {/* The Hearth Stage: Ember Momentum + Root Becoming */}
        <div className="hearth-stage-duo">
          <EmberDisplay
            state={snapshot.emberState}
            isRelit={isEmberRelit}
          />
          <HearthRootPreview
            branches={snapshot.branches}
            highlightAttribute={highlightAttribute}
          />
        </div>

        {/* TODAY Section: Field Journal & Inscribed Quests */}
        <QuestJournal
          quests={quests}
          completedQuestIds={completedQuestIds}
          pendingQuestId={pendingQuestId}
          errorQuestMap={errorQuestMap}
          onCompleteQuest={handleCompleteQuest}
          onRetryQuest={handleRetryQuest}
          onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
        />

        {/* QA Diagnostic Tool (Subtle, for verifying failure & retry handling) */}
        <aside className="hearth-qa-diagnostic" aria-label="Testing Controls">
          <label className="qa-toggle-label">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
            />
            <span>Simulate network interruption on next quest completion (tests inline retry)</span>
          </label>
        </aside>
      </main>

      {/* Mobile Safe Area Inset Spacer */}
      <div className="mobile-safe-bottom" aria-hidden="true" />

      {/* Inscribe Quest Modal */}
      <QuestCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateQuest={handleCreateQuest}
      />
    </div>
  );
};
