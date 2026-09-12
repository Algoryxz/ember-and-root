import React, { useState } from 'react';
import { AttributeId, GameSnapshot, Specialization } from '../../game/contracts';
import { RootSvg } from './RootSvg';
import {
  chooseSpecializationAction,
  startTrialAction,
  progressSessionTrialAction,
  recordMilestoneAction,
  claimCrestAction,
} from './trialAdapter';
import {
  INITIAL_TREE_STATE,
  SPEC_READY_TREE_STATE,
  SPECIALIZED_TREE_STATE,
} from './fixtures';

export const RootInteractiveView: React.FC = () => {
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
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
  });

  const [isPending, setIsPending] = useState<boolean>(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const handleSelectSpecialization = async (attribute: AttributeId, spec: Specialization): Promise<void> => {
    if (isPending) return;
    setIsPending(true);
    setMutationError(null);
    try {
      const result = await chooseSpecializationAction(snapshot, attribute, spec);
      setSnapshot(result.snapshot);
      setLastEvent(`Event: ${result.event.kind} (${attribute} -> ${spec})`);
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
      const result = await startTrialAction(snapshot, attribute, spec);
      setSnapshot(result.snapshot);
      setLastEvent(`Event: ${result.event.kind} (${attribute} Trial Started)`);
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
      const result = await progressSessionTrialAction(snapshot, attribute);
      setSnapshot(result.snapshot);
      setLastEvent(`Event: ${result.event.kind} (Evidence recorded for ${attribute})`);
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
      const result = await recordMilestoneAction(snapshot, attribute, milestoneText);
      setSnapshot(result.snapshot);
      setLastEvent(`Event: ${result.event.kind} (Milestone declared for ${attribute})`);
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
      const result = await claimCrestAction(snapshot, attribute);
      setSnapshot(result.snapshot);
      setLastEvent(`Event: ${result.event.kind} (${attribute} Crest Claimed!)`);
    } catch (err: any) {
      setMutationError(err.message || 'Failed to claim crest');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
        backgroundColor: '#141713',
        minHeight: '100vh',
        color: '#F0E7D3',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <header style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: '24px',
            margin: '0 0 4px 0',
            color: '#F0E7D3',
          }}
        >
          Ember & Root — Skill Tree & Trials
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#B9BEAC' }}>
          Authoritative Mutation Wiring (Lead: <strong>Akriti</strong>)
        </p>
      </header>

      {/* Mutation Status & Event Banner */}
      {lastEvent && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#1F2A1E',
            border: '1px solid #9FBA87',
            borderRadius: '6px',
            color: '#D9E3B2',
            fontSize: '12px',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          ✨ {lastEvent} (Snapshot Revision: {snapshot.revision})
        </div>
      )}

      {/* Fixture Preset Bar */}
      <div
        style={{
          backgroundColor: '#1D231D',
          border: '1px solid #2B352B',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#B9BEAC', marginBottom: '8px' }}>
          SNAPSHOT FIXTURE PRESETS:
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
              borderRadius: '6px',
              border: '1px solid #3B463B',
              backgroundColor: '#141713',
              color: '#F0E7D3',
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
              borderRadius: '6px',
              border: '1px solid #E98A4B',
              backgroundColor: '#382B1D',
              color: '#FFD38A',
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
              borderRadius: '6px',
              border: '1px solid #9FBA87',
              backgroundColor: '#263323',
              color: '#D9E3B2',
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            3. All Specialized
          </button>
        </div>
      </div>

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
