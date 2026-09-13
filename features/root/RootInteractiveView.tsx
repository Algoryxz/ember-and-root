import React, { useState, useEffect } from 'react';
import { AttributeId, GameSnapshot, Specialization } from '../../game/contracts';
import { RootSvg } from './RootSvg';
import { TOKENS } from './tokens';
import './root.css';
import {
  chooseSpecializationAction,
  startTrialAction,
  progressSessionTrialAction,
  recordMilestoneAction,
  claimCrestAction,
} from './trialAdapter';
import {
  chooseSpecializationFixtureAdapter,
  startTrialFixtureAdapter,
  progressSessionTrialFixtureAdapter,
  recordMilestoneFixtureAdapter,
  claimCrestFixtureAdapter,
} from './trialFixtureAdapter';
import {
  INITIAL_TREE_STATE,
  SPEC_READY_TREE_STATE,
  SPECIALIZED_TREE_STATE,
} from './fixtures';

export interface RootInteractiveViewProps {
  snapshot?: GameSnapshot;
  onSnapshotChange?: (snapshot: GameSnapshot) => void;
  supabaseClient?: any;
  showDevPresets?: boolean;
}

export const RootInteractiveView: React.FC<RootInteractiveViewProps> = ({
  snapshot: externalSnapshot,
  onSnapshotChange,
  supabaseClient,
  showDevPresets,
}: RootInteractiveViewProps) => {
  // If externalSnapshot is provided or client is passed, dev presets are hidden by default
  const isProduction = !!externalSnapshot || !!supabaseClient;
  const shouldShowPresets = showDevPresets !== undefined ? showDevPresets : !isProduction;

  const [snapshot, setSnapshot] = useState<GameSnapshot>(
    externalSnapshot || {
      revision: 1,
      userId: 'demo-user',
      totalXp: 280,
      level: 2,
      sparksBalance: 20,
      currentStreak: 3,
      longestStreak: 7,
      emberState: 'kindled',
      todayXpAwarded: 20,
      branches: INITIAL_TREE_STATE.branches,
      trials: {},
      equippedItemId: null,
      inventory: { items: [] },
    }
  );

  // Sync external snapshot when provided by parent
  useEffect(() => {
    if (externalSnapshot) {
      setSnapshot(externalSnapshot);
    }
  }, [externalSnapshot]);

  const [isPending, setIsPending] = useState<boolean>(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const applySnapshotResult = (newSnapshot: GameSnapshot, eventDesc: string) => {
    setSnapshot(newSnapshot);
    setLastEvent(eventDesc);
    onSnapshotChange?.(newSnapshot);
  };

  const handleSelectSpecialization = async (attribute: AttributeId, spec: Specialization): Promise<void> => {
    if (isPending) return;
    setIsPending(true);
    setMutationError(null);
    try {
      if (supabaseClient && typeof supabaseClient.rpc === 'function') {
        const result = await chooseSpecializationAction(snapshot, attribute, spec, supabaseClient);
        applySnapshotResult(result.snapshot, `Event: ${result.event.kind} (${attribute} -> ${spec})`);
      } else if (!isProduction) {
        // Dev visual preview only
        const result = chooseSpecializationFixtureAdapter(snapshot, attribute, spec);
        applySnapshotResult(result.snapshot, `[Preview] Event: ${result.event.kind} (${attribute} -> ${spec})`);
      } else {
        throw new Error('An authoritative Supabase client is required for production mutations.');
      }
    } catch (err: any) {
      setMutationError(err.message || 'Failed to select specialization');
    } finally {
      setIsPending(false);
    }
  };

  const handleStartTrial = async (attribute: AttributeId, spec: Specialization): Promise<void> => {
    if (isPending) return;
    setIsPending(true);
    setMutationError(null);
    try {
      if (supabaseClient && typeof supabaseClient.rpc === 'function') {
        const result = await startTrialAction(snapshot, attribute, spec, supabaseClient);
        applySnapshotResult(result.snapshot, `Event: ${result.event.kind} (${attribute} Trial Started)`);
      } else if (!isProduction) {
        // Dev visual preview only
        const result = startTrialFixtureAdapter(snapshot, attribute, spec);
        applySnapshotResult(result.snapshot, `[Preview] Event: ${result.event.kind} (${attribute} Trial Started)`);
      } else {
        throw new Error('An authoritative Supabase client is required for production mutations.');
      }
    } catch (err: any) {
      setMutationError(err.message || 'Failed to start trial');
    } finally {
      setIsPending(false);
    }
  };

  const handleProgressSession = async (attribute: AttributeId): Promise<void> => {
    if (isPending) return;
    setIsPending(true);
    setMutationError(null);
    try {
      if (supabaseClient && typeof supabaseClient.rpc === 'function') {
        const result = await progressSessionTrialAction(snapshot, attribute, supabaseClient);
        applySnapshotResult(result.snapshot, `Event: ${result.event.kind} (Evidence recorded for ${attribute})`);
      } else if (!isProduction) {
        // Dev visual preview only
        const result = progressSessionTrialFixtureAdapter(snapshot, attribute);
        applySnapshotResult(result.snapshot, `[Preview] Event: ${result.event.kind} (Evidence recorded for ${attribute})`);
      } else {
        throw new Error('An authoritative Supabase client is required for production mutations.');
      }
    } catch (err: any) {
      setMutationError(err.message || 'Failed to progress session');
    } finally {
      setIsPending(false);
    }
  };

  const handleRecordMilestone = async (attribute: AttributeId, milestoneText: string): Promise<void> => {
    if (isPending) return;
    setIsPending(true);
    setMutationError(null);
    try {
      if (supabaseClient && typeof supabaseClient.rpc === 'function') {
        const result = await recordMilestoneAction(snapshot, attribute, milestoneText, supabaseClient);
        applySnapshotResult(result.snapshot, `Event: ${result.event.kind} (Milestone declared for ${attribute})`);
      } else if (!isProduction) {
        // Dev visual preview only
        const result = recordMilestoneFixtureAdapter(snapshot, attribute, milestoneText);
        applySnapshotResult(result.snapshot, `[Preview] Event: ${result.event.kind} (Milestone declared for ${attribute})`);
      } else {
        throw new Error('An authoritative Supabase client is required for production mutations.');
      }
    } catch (err: any) {
      setMutationError(err.message || 'Failed to record milestone');
    } finally {
      setIsPending(false);
    }
  };

  const handleClaimCrest = async (attribute: AttributeId): Promise<void> => {
    if (isPending) return;
    setIsPending(true);
    setMutationError(null);
    try {
      if (supabaseClient && typeof supabaseClient.rpc === 'function') {
        const result = await claimCrestAction(snapshot, attribute, supabaseClient);
        applySnapshotResult(result.snapshot, `Event: ${result.event.kind} (${attribute} Crest Claimed!)`);
      } else if (!isProduction) {
        // Dev visual preview only
        const result = claimCrestFixtureAdapter(snapshot, attribute);
        applySnapshotResult(result.snapshot, `[Preview] Event: ${result.event.kind} (${attribute} Crest Claimed!)`);
      } else {
        throw new Error('An authoritative Supabase client is required for production mutations.');
      }
    } catch (err: any) {
      setMutationError(err.message || 'Failed to claim crest');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="root-interactive-shell">
            {/* Dedicated Root Data & Progression Overview Panel (Above Schematic) */}
      <header className="root-hero-section">
        <h1 className="root-hero-title">
          THE ROOT
        </h1>
        <p className="root-hero-subtitle">
          The canopy of permanent becoming. What you do becomes who you are.
        </p>
      </header>

      <section className="root-data-overview-panel" aria-label="Root State and Progression Overview">
        <div className="root-data-overview-header">
          <span className="root-data-overview-eyebrow">Canopy Progression Ledger</span>
          <span className="root-data-overview-streak">
            <span aria-hidden="true">🔥</span>
            <span>{snapshot.currentStreak} Day Ritual Streak</span>
          </span>
        </div>

        <div className="root-data-stat-grid">
          <div className="root-data-stat-card">
            <span className="root-data-stat-label">Total Vitality</span>
            <span className="root-data-stat-value">{snapshot.totalXp} XP</span>
            <span className="root-data-stat-meta">Level {snapshot.level} Seeker</span>
          </div>

          <div className="root-data-stat-card">
            <span className="root-data-stat-label">Ember State</span>
            <span className="root-data-stat-value" style={{ textTransform: 'capitalize' }}>
              {snapshot.emberState}
            </span>
            <span className="root-data-stat-meta">+{snapshot.todayXpAwarded} XP Today</span>
          </div>

          <div className="root-data-stat-card">
            <span className="root-data-stat-label">Sparks Balance</span>
            <span className="root-data-stat-value">✦ {snapshot.sparksBalance}</span>
            <span className="root-data-stat-meta">Sacred Currency</span>
          </div>

          <div className="root-data-stat-card">
            <span className="root-data-stat-label">Longest Flame</span>
            <span className="root-data-stat-value">{snapshot.longestStreak} Days</span>
            <span className="root-data-stat-meta">Unbroken Practice</span>
          </div>
        </div>
      </section>

      {/* Mutation Status & Event Banner */}
      {lastEvent && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: TOKENS.color.surfaceHover,
            border: `1px solid ${TOKENS.color.root}`,
            borderRadius: TOKENS.radius.md,
            color: TOKENS.color.rootMature,
            fontSize: '12px',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          âœ¨ {lastEvent}
        </div>
      )}

      {/* Inline Mutation Error */}
      {mutationError && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            backgroundColor: TOKENS.color.errorBg,
            border: `1px solid ${TOKENS.color.error}`,
            borderRadius: TOKENS.radius.md,
            color: TOKENS.color.error,
            fontSize: '12px',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          <strong>Error:</strong> {mutationError}
        </div>
      )}

      {/* Fixture Preset Bar (Dev/Preview Only) */}
      {shouldShowPresets && (
        <div
          style={{
            backgroundColor: TOKENS.color.surface,
            border: `1px solid ${TOKENS.color.borderDefault}`,
            borderRadius: TOKENS.radius.lg,
            padding: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: TOKENS.color.textSecondary, marginBottom: '8px' }}>
            PREVIEW FIXTURE PRESETS:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setSnapshot((prev) => ({
                  ...prev,
                  revision: prev.revision + 1,
                  branches: INITIAL_TREE_STATE.branches,
                  trials: {},
                }));
                setLastEvent('Loaded Initial State (70 XP)');
              }}
              style={{
                padding: '8px 4px',
                fontSize: '11px',
                borderRadius: TOKENS.radius.md,
                border: `1px solid ${TOKENS.color.borderLocked}`,
                backgroundColor: TOKENS.color.bg,
                color: TOKENS.color.textPrimary,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              1. Initial (70 XP)
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setSnapshot((prev) => ({
                  ...prev,
                  revision: prev.revision + 1,
                  branches: SPEC_READY_TREE_STATE.branches,
                  trials: {},
                }));
                setLastEvent('Loaded Spec Ready State (90 XP)');
              }}
              style={{
                padding: '8px 4px',
                fontSize: '11px',
                borderRadius: TOKENS.radius.md,
                border: `1px solid ${TOKENS.color.ember}`,
                backgroundColor: TOKENS.color.nodeLocked,
                color: TOKENS.color.emberCore,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              2. Spec Ready (90 XP)
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setSnapshot((prev) => ({
                  ...prev,
                  revision: prev.revision + 1,
                  branches: SPECIALIZED_TREE_STATE.branches,
                }));
                setLastEvent('Loaded All Specialized State');
              }}
              style={{
                padding: '8px 4px',
                fontSize: '11px',
                borderRadius: TOKENS.radius.md,
                border: `1px solid ${TOKENS.color.root}`,
                backgroundColor: TOKENS.color.surfaceHover,
                color: TOKENS.color.rootMature,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              3. All Specialized
            </button>
          </div>
        </div>
      )}

      {/* Main Root Component */}
      <RootSvg
        snapshot={snapshot}
        isPending={isPending}
        error={mutationError}
        onSelectSpecialization={handleSelectSpecialization}
        onStartTrial={handleStartTrial}
        onProgressSession={handleProgressSession}
        onRecordMilestone={handleRecordMilestone}
        onClaimCrest={handleClaimCrest}
      />
    </div>
  );
};

