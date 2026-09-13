import React, { useState } from 'react';
import {
  DEMO_SNAPSHOT,
  completeQuestAction,
  createQuestAction,
  updateQuestAction,
  updateQuestNotesAction,
  type AttributeId,
  type CreateQuestParams,
  type UpdateQuestParams,
  type GameSnapshot,
  type HearthQuest,
  type MutationEvent,
  type MutationResult,
  type Quest,
  type SupabaseClientLike,
} from './contracts';
import { EmberDisplay } from './EmberDisplay';
import { HearthRootPreview } from './HearthRootPreview';
import { QuestJournal } from './QuestJournal';
import { QuestCreateDialog } from './QuestCreateDialog';
import { QuestEditDialog } from './QuestEditDialog';
import { RewardSequence } from './RewardSequence';
import { FocusRitual } from '../focus';
import './HearthView.css';

export interface HearthViewProps {
  initialSnapshot?: GameSnapshot;
  supabaseClient?: any;
  showShellNav?: boolean;
  showDevTools?: boolean;
  onMutationSuccess?: (result: MutationResult) => void;
  onNavigateToRoot?: () => void;
  className?: string;
}

/**
 * HearthView — Top-level Hearth experience
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Botanical Field Journal Folio
 * 
 * Hierarchy:
 * 1. App Shell Nav & Character Status Strip (if showShellNav is true)
 * 2. HEARTH Title & "Today is where the path begins."
 * 3. Living Ember Momentum (Centered Focal Warmth)
 * 4. Editorial Field Spread:
 *      Left: TODAY's Inscribed Quests Journal (Sequence of practices with physical seals)
 *      Right: Living Root Specimen Plate (Canonical cutting with anatomical markers)
 * 5. Quest Actions & Inscription / Revise Modals
 * 6. Non-blocking Reward & Progression Notices (RewardSequence)
 */
export const HearthView: React.FC<HearthViewProps> = ({
  initialSnapshot = DEMO_SNAPSHOT,
  supabaseClient = null,
  showShellNav = true,
  showDevTools = false,
  onMutationSuccess,
  onNavigateToRoot,
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
  const [hoveredAttribute, setHoveredAttribute] = useState<AttributeId | null>(null);
  const [isEmberRelit, setIsEmberRelit] = useState<boolean>(false);
  const [showPathReadyNotice, setShowPathReadyNotice] = useState<boolean>(false);

  // Dialog & Ritual states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [editingQuest, setEditingQuest] = useState<Quest | HearthQuest | null>(null);
  const [focusQuest, setFocusQuest] = useState<Quest | HearthQuest | null>(null);

  // Failure simulation toggle (for QA and manual verification of retry behavior)
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Core Quest Completion Flow (Strictly follows docs/APP_FLOW.md §§ 8 & 9)
  // --------------------------------------------------------------------------
  const handleCompleteQuest = async (questId: string) => {
    if (pendingQuestId) return;

    const quests = snapshot.quests || [];
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    // Check if already completed
    const isAlreadyCompleted =
      completedQuestIds.has(questId) ||
      ('completedForCurrentOccurrence' in quest && quest.completedForCurrentOccurrence);
    if (isAlreadyCompleted) return;

    // Set optimistic in-flight state
    setPendingQuestId(questId);
    setErrorQuestMap((prev) => {
      const copy = { ...prev };
      delete copy[questId];
      return copy;
    });

    try {
      // Invoke authoritative completeQuestAction via thin Hearth adapter
      const result = await completeQuestAction(
        snapshot,
        questId,
        supabaseClient,
        undefined,
        simulateFailure
      );

      // Transition to sealed state upon authoritative confirmation
      setCompletedQuestIds((prev) => new Set([...Array.from(prev), questId]));

      // Apply authoritative snapshot from server mutation (NO local math)
      setSnapshot(result.snapshot);

      // Trigger reward sequence choreography
      if (result.event) {
        setActiveQuestTitle(quest.title);
        setActiveEvent(result.event);
        setHighlightAttribute(result.event.attribute ?? null);
        setIsEmberRelit(result.event.emberRelit ?? false);

        // Check if milestone achieved
        if (result.event.specializationAvailable || result.event.crestAvailable) {
          setShowPathReadyNotice(true);
        }
      }

      if (onMutationSuccess) {
        onMutationSuccess(result);
      }
    } catch (err: any) {
      // Handle network or validation failure: render inline retry affordance
      setErrorQuestMap((prev) => ({
        ...prev,
        [questId]: err?.message || 'Could not seal practice. Check connection and retry.',
      }));
    } finally {
      setPendingQuestId(null);
    }
  };

  const handleRetryQuest = (questId: string) => {
    handleCompleteQuest(questId);
  };

  // --------------------------------------------------------------------------
  // Inscribe Practice Action Flow
  // --------------------------------------------------------------------------
  const handleCreateQuest = async (params: CreateQuestParams) => {
    // Invoke authoritative createQuestAction via thin Hearth adapter
    const result = await createQuestAction(
      snapshot,
      params,
      supabaseClient,
      undefined,
      simulateFailure
    );

    // Apply authoritative snapshot from server mutation (NO local math)
    setSnapshot(result.snapshot);
    if (onMutationSuccess) onMutationSuccess(result);
  };

  // --------------------------------------------------------------------------
  // Revise Practice Action Flow
  // --------------------------------------------------------------------------
  const handleUpdateQuest = async (questId: string, updates: UpdateQuestParams) => {
    // Invoke authoritative updateQuestAction via thin Hearth adapter
    const result = await updateQuestAction(
      snapshot,
      questId,
      updates,
      supabaseClient,
      undefined,
      simulateFailure
    );

    // Apply authoritative snapshot from server mutation (NO local math)
    setSnapshot(result.snapshot);
    if (onMutationSuccess) onMutationSuccess(result);
  };

  // --------------------------------------------------------------------------
  // Marginalia Quest Notes Action Flow
  // --------------------------------------------------------------------------
  const handleUpdateQuestNotes = async (questId: string, notes: string | null) => {
    const result = await updateQuestNotesAction(
      snapshot,
      questId,
      notes,
      supabaseClient,
      simulateFailure
    );
    setSnapshot(result.snapshot);
  };

  const quests = snapshot.quests || [];

  return (
    <div className={`hearth-shell ${className}`}>
      {/* Accessible skip link */}
      <a href="#today-heading" className="skip-link">
        Skip to Today’s Journal
      </a>

      {/* App Shell Navigation Bar */}
      {showShellNav && (
        <header className="hearth-app-header">
          <div className="hearth-header-inner">
            <div className="hearth-brand">
              <div className="hearth-brand-flame" aria-hidden="true" />
              <span className="hearth-brand-name">Ember &amp; Root</span>
            </div>

            <nav aria-label="Primary game destinations" className="hearth-main-nav">
              <ul className="hearth-nav-list">
                <li className="hearth-nav-item is-active">
                  <a href="/hearth" aria-current="page">
                    Hearth
                  </a>
                </li>
                <li className="hearth-nav-item">
                  <a href="/root">Root</a>
                </li>
                <li className="hearth-nav-item">
                  <a href="/satchel">Satchel</a>
                </li>
                <li className="hearth-nav-item">
                  <a href="/chronicle">Chronicle</a>
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
      )}

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

        {/* Focal Top Anchor: Living Ember Momentum */}
        <section className="hearth-ember-stage" aria-label="Current Ember state">
          <EmberDisplay
            state={snapshot.emberState}
            isRelit={isEmberRelit}
            adornment={snapshot.equippedItemId ?? (snapshot as any).equippedItem}
          />
        </section>

        {/* Editorial Field Spread: Quest Journal (Left) & Root Specimen Plate (Right) */}
        <div className="hearth-field-spread">
          <div className="hearth-spread-journal">
            <QuestJournal
              quests={quests}
              completedQuestIds={completedQuestIds}
              pendingQuestId={pendingQuestId}
              errorQuestMap={errorQuestMap}
              onCompleteQuest={handleCompleteQuest}
              onBeginFocusQuest={setFocusQuest}
              onEditQuest={(q) => setEditingQuest(q)}
              onRetryQuest={handleRetryQuest}
              onUpdateQuestNotes={handleUpdateQuestNotes}
              onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
              onAttributeHover={setHoveredAttribute}
            />
          </div>

          <div className="hearth-spread-specimen">
            <HearthRootPreview
              branches={snapshot.branches}
              highlightAttribute={highlightAttribute}
              hoverAttribute={hoveredAttribute}
              onNavigateToRoot={onNavigateToRoot}
            />
          </div>
        </div>

        {/* QA Diagnostic Tool */}
        {process.env.NODE_ENV !== 'production' && showDevTools && (
          <aside className="hearth-qa-diagnostic" aria-label="Testing Controls">
            <label className="qa-toggle-label">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
              />
              <span>Simulate network interruption on next quest operation (tests inline retry)</span>
            </label>
          </aside>
        )}
      </main>

      {/* Mobile Safe Area Inset Spacer */}
      <div className="mobile-safe-bottom" aria-hidden="true" />

      {/* Inscribe Quest Modal */}
      <QuestCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateQuest={handleCreateQuest}
      />

      {/* Revise Quest Modal */}
      <QuestEditDialog
        isOpen={Boolean(editingQuest)}
        quest={editingQuest}
        onClose={() => setEditingQuest(null)}
        onUpdateQuest={handleUpdateQuest}
      />

      {/* Focus Ritual Atmospheric Modal */}
      {focusQuest && (
        <FocusRitual
          quest={focusQuest}
          isOpen={Boolean(focusQuest)}
          onClose={() => setFocusQuest(null)}
          onSeal={(questId) => handleCompleteQuest(questId)}
        />
      )}
    </div>
  );
};
