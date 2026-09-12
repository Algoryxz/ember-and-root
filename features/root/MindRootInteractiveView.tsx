import React, { useState } from 'react';
import { MindBranch } from './MindBranch';
import { MindBranchState, SpecializationId } from './types';
import { TOKENS } from './tokens';
import {
  INITIAL_MIND_STATE,
  AVAILABLE_MIND_STATE,
  SCHOLAR_MIND_STATE,
  EXPLORER_MIND_STATE,
} from './fixtures';

export const MindRootInteractiveView: React.FC = () => {
  const [currentState, setCurrentState] = useState<MindBranchState>(INITIAL_MIND_STATE);

  const handleSelectSpecialization = (spec: SpecializationId): void => {
    setCurrentState((prev: MindBranchState) => ({
      ...prev,
      selectedSpecialization: spec,
      specializationAvailable: false,
    }));
  };

  return (
    <div
      style={{
        padding: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
        backgroundColor: TOKENS.color.bg,
        minHeight: '100vh',
        color: TOKENS.color.textPrimary,
        fontFamily: TOKENS.font.ui,
      }}
    >
      <header style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: TOKENS.font.display,
            fontSize: '24px',
            margin: '0 0 4px 0',
            color: TOKENS.color.textPrimary,
          }}
        >
          Ember & Root — Mind Branch
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: TOKENS.color.textSecondary }}>
          The canopy of permanent becoming.
        </p>
      </header>

      {/* Fixture State Controls Bar */}
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
          TEST FIXTURE STATES:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setCurrentState(INITIAL_MIND_STATE)}
            style={{
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: TOKENS.radius.md,
              border: `1px solid ${TOKENS.color.borderLocked}`,
              backgroundColor:
                currentState.xp === 70 ? TOKENS.color.surfaceHover : TOKENS.color.bg,
              color: TOKENS.color.textPrimary,
              cursor: 'pointer',
            }}
          >
            1. Initial (70 XP)
          </button>

          <button
            type="button"
            onClick={() => setCurrentState(AVAILABLE_MIND_STATE)}
            style={{
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: TOKENS.radius.md,
              border: `1px solid ${TOKENS.color.ember}`,
              backgroundColor:
                currentState.specializationAvailable ? TOKENS.color.nodeLocked : TOKENS.color.bg,
              color: TOKENS.color.emberCore,
              cursor: 'pointer',
            }}
          >
            2. Spec Ready (90 XP)
          </button>

          <button
            type="button"
            onClick={() => setCurrentState(SCHOLAR_MIND_STATE)}
            style={{
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: TOKENS.radius.md,
              border: `1px solid ${TOKENS.color.root}`,
              backgroundColor:
                currentState.selectedSpecialization === 'scholar'
                  ? TOKENS.color.surfaceHover
                  : TOKENS.color.bg,
              color: TOKENS.color.rootMature,
              cursor: 'pointer',
            }}
          >
            3. Scholar Selected
          </button>

          <button
            type="button"
            onClick={() => setCurrentState(EXPLORER_MIND_STATE)}
            style={{
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: TOKENS.radius.md,
              border: `1px solid ${TOKENS.color.root}`,
              backgroundColor:
                currentState.selectedSpecialization === 'explorer'
                  ? TOKENS.color.surfaceHover
                  : TOKENS.color.bg,
              color: TOKENS.color.rootMature,
              cursor: 'pointer',
            }}
          >
            4. Explorer Selected
          </button>
        </div>
      </div>

      {/* Main Mind Branch Component */}
      <MindBranch
        state={currentState}
        onSelectSpecialization={handleSelectSpecialization}
      />
    </div>
  );
};
