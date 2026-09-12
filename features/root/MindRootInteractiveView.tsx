import React, { useState } from 'react';
import { MindBranch } from './MindBranch';
import { MindBranchState, SpecializationId } from './types';
import {
  INITIAL_MIND_STATE,
  AVAILABLE_MIND_STATE,
  SCHOLAR_MIND_STATE,
  EXPLORER_MIND_STATE,
} from './fixtures';

export const MindRootInteractiveView: React.FC = () => {
  const [currentState, setCurrentState] = useState<MindBranchState>(INITIAL_MIND_STATE);

  const handleSelectSpecialization = (spec: SpecializationId) => {
    setCurrentState((prev) => ({
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
          Ember & Root — Mind Branch
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#B9BEAC' }}>
          Workstream Lead: <strong>Akriti</strong> (Mobile 375px Verified)
        </p>
      </header>

      {/* Fixture State Controls Bar */}
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
          TEST FIXTURE STATES:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setCurrentState(INITIAL_MIND_STATE)}
            style={{
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #3B463B',
              backgroundColor:
                currentState.mindXP === 70 ? '#263323' : '#141713',
              color: '#F0E7D3',
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
              borderRadius: '6px',
              border: '1px solid #E98A4B',
              backgroundColor:
                currentState.specializationAvailable ? '#382B1D' : '#141713',
              color: '#FFD38A',
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
              borderRadius: '6px',
              border: '1px solid #9FBA87',
              backgroundColor:
                currentState.selectedSpecialization === 'scholar'
                  ? '#263323'
                  : '#141713',
              color: '#D9E3B2',
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
              borderRadius: '6px',
              border: '1px solid #9FBA87',
              backgroundColor:
                currentState.selectedSpecialization === 'explorer'
                  ? '#263323'
                  : '#141713',
              color: '#D9E3B2',
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
