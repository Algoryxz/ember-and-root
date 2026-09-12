import React, { useState } from 'react';
import { AttributeId, GameSnapshot, Specialization } from '../../game/contracts';
import { RootSvg } from './RootSvg';
import {
  startTrialAdapter,
  progressTrialSessionAdapter,
  recordMilestoneAdapter,
  claimTrialCrestAdapter,
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

  const handleSelectSpecialization = (attribute: AttributeId, spec: Specialization): void => {
    setSnapshot((prev) => ({
      ...prev,
      branches: {
        ...prev.branches,
        [attribute]: {
          ...prev.branches[attribute],
          specialization: spec,
          specializationAvailable: false,
        },
      },
    }));
  };

  const handleStartTrial = (attribute: AttributeId, spec: Specialization): void => {
    setSnapshot((prev) => startTrialAdapter(prev, attribute, spec));
  };

  const handleProgressSession = (attribute: AttributeId): void => {
    setSnapshot((prev) => progressTrialSessionAdapter(prev, attribute));
  };

  const handleRecordMilestone = (attribute: AttributeId, milestoneText: string): void => {
    setSnapshot((prev) => recordMilestoneAdapter(prev, attribute, milestoneText));
  };

  const handleClaimCrest = (attribute: AttributeId): void => {
    setSnapshot((prev) => claimTrialCrestAdapter(prev, attribute));
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
          Mind · Body · Will · Craft (Lead: <strong>Akriti</strong>)
        </p>
      </header>

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
            onClick={() =>
              setSnapshot((prev) => ({
                ...prev,
                branches: INITIAL_TREE_STATE.branches,
                trials: {},
              }))
            }
            style={{
              padding: '8px 4px',
              fontSize: '11px',
              borderRadius: '6px',
              border: '1px solid #3B463B',
              backgroundColor: '#141713',
              color: '#F0E7D3',
              cursor: 'pointer',
            }}
          >
            1. Initial (70 XP)
          </button>

          <button
            type="button"
            onClick={() =>
              setSnapshot((prev) => ({
                ...prev,
                branches: SPEC_READY_TREE_STATE.branches,
                trials: {},
              }))
            }
            style={{
              padding: '8px 4px',
              fontSize: '11px',
              borderRadius: '6px',
              border: '1px solid #E98A4B',
              backgroundColor: '#382B1D',
              color: '#FFD38A',
              cursor: 'pointer',
            }}
          >
            2. Spec Ready (90 XP)
          </button>

          <button
            type="button"
            onClick={() =>
              setSnapshot((prev) => ({
                ...prev,
                branches: SPECIALIZED_TREE_STATE.branches,
              }))
            }
            style={{
              padding: '8px 4px',
              fontSize: '11px',
              borderRadius: '6px',
              border: '1px solid #9FBA87',
              backgroundColor: '#263323',
              color: '#D9E3B2',
              cursor: 'pointer',
            }}
          >
            3. All Specialized
          </button>
        </div>
      </div>

      {/* Main Root Component */}
      <RootSvg
        snapshot={snapshot}
        onSelectSpecialization={handleSelectSpecialization}
        onStartTrial={handleStartTrial}
        onProgressSession={handleProgressSession}
        onRecordMilestone={handleRecordMilestone}
        onClaimCrest={handleClaimCrest}
      />
    </div>
  );
};
