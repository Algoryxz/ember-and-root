import React, { useState } from 'react';
import { RootSvg } from './RootSvg';
import { AttributeId, RootTreeState, SpecializationId } from './types';
import {
  INITIAL_TREE_STATE,
  SPEC_READY_TREE_STATE,
  SPECIALIZED_TREE_STATE,
} from './fixtures';

export const RootInteractiveView: React.FC = () => {
  const [treeState, setTreeState] = useState<RootTreeState>(INITIAL_TREE_STATE);

  const handleSelectSpecialization = (attribute: AttributeId, spec: SpecializationId): void => {
    setTreeState((prev: RootTreeState) => ({
      ...prev,
      branches: {
        ...prev.branches,
        [attribute]: {
          ...prev.branches[attribute],
          selectedSpecialization: spec,
          specializationAvailable: false,
        },
      },
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
          Ember & Root — 4 Branch Skill Tree
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
          TREE FIXTURE PRESETS:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setTreeState(INITIAL_TREE_STATE)}
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
            onClick={() => setTreeState(SPEC_READY_TREE_STATE)}
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
            onClick={() => setTreeState(SPECIALIZED_TREE_STATE)}
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
        treeState={treeState}
        onSelectSpecialization={handleSelectSpecialization}
      />
    </div>
  );
};
