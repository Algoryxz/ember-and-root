import React, { useState } from 'react';
import { MindBranchState, MindNodeInfo, NodeState, SpecializationId } from './types';
import { MindBranchSvg } from './svg/MindBranchSvg';
import { RootNodeButton } from './RootNodeButton';
import { MindRootList } from './MindRootList';
import './root.css';

export interface MindBranchProps {
  state: MindBranchState;
  onSelectSpecialization?: (spec: SpecializationId) => void;
  className?: string;
}

export const MindBranch: React.FC<MindBranchProps> = ({
  state,
  onSelectSpecialization,
  className = '',
}: MindBranchProps) => {
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  const { mindXP, selectedSpecialization, specializationAvailable } = state;

  // Compute states for nodes
  const firstThoughtState: NodeState = mindXP >= 1 ? 'unlocked' : 'locked';

  let scholarState: NodeState = 'locked';
  let explorerState: NodeState = 'locked';

  if (selectedSpecialization === 'scholar') {
    scholarState = 'selected';
    explorerState = 'locked';
  } else if (selectedSpecialization === 'explorer') {
    explorerState = 'selected';
    scholarState = 'locked';
  } else if (specializationAvailable) {
    scholarState = 'available';
    explorerState = 'available';
  }

  const scholarsCrownState: NodeState =
    selectedSpecialization === 'scholar' ? 'available' : 'locked';

  const explorersCompassState: NodeState =
    selectedSpecialization === 'explorer' ? 'available' : 'locked';

  // Node definitions with coordinates matching SVG viewBox 360x480
  const nodes: MindNodeInfo[] = [
    {
      id: 'first_thought',
      label: 'First Thought',
      subtitle: 'Origin Sprout',
      type: 'origin',
      state: firstThoughtState,
      xpRequired: 1,
      description: 'The initial spark of intellectual inquiry.',
      coordinates: { x: 180, y: 80, percentX: 50, percentY: 16.6 },
    },
    {
      id: 'scholar',
      label: 'Scholar',
      subtitle: 'Path of Deep Study',
      type: 'specialization',
      specializationKey: 'scholar',
      state: scholarState,
      xpRequired: 80,
      description: 'Dedicate your mind to rigorous analysis, reflection, and theory.',
      coordinates: { x: 100, y: 220, percentX: 27.7, percentY: 45.8 },
    },
    {
      id: 'explorer',
      label: 'Explorer',
      subtitle: 'Path of Discovery',
      type: 'specialization',
      specializationKey: 'explorer',
      state: explorerState,
      xpRequired: 80,
      description: 'Expand your mental horizons through broad experimentation and curiosity.',
      coordinates: { x: 260, y: 220, percentX: 72.2, percentY: 45.8 },
    },
    {
      id: 'scholars_crown',
      label: "Scholar's Crown",
      subtitle: 'Mastery Crest',
      type: 'crest',
      state: scholarsCrownState,
      xpRequired: 160,
      description: 'Permanent Crest awarded for complete Scholar Trial mastery.',
      coordinates: { x: 100, y: 370, percentX: 27.7, percentY: 77.0 },
    },
    {
      id: 'explorers_compass',
      label: "Explorer's Compass",
      subtitle: 'Mastery Crest',
      type: 'crest',
      state: explorersCompassState,
      xpRequired: 160,
      description: 'Permanent Crest awarded for complete Explorer Trial mastery.',
      coordinates: { x: 260, y: 370, percentX: 72.2, percentY: 77.0 },
    },
  ];

  return (
    <section
      className={`root-branch-container ${className}`}
      aria-label="Mind Root Branch"
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          borderBottom: '1px solid rgba(159, 186, 135, 0.15)',
          paddingBottom: '8px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'Fraunces, serif',
              fontSize: '20px',
              color: '#F0E7D3',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#9FBA87',
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            Mind Branch
          </h2>
          <span style={{ fontSize: '12px', color: '#B9BEAC' }}>
            Intellect, Knowledge & Focus ({mindXP} XP)
          </span>
        </div>

        {/* Accessible View Toggle Button */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'visual' ? 'list' : 'visual')}
          style={{
            backgroundColor: '#141713',
            color: '#F0E7D3',
            border: '1px solid #3B463B',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            minHeight: '36px',
          }}
          aria-label={`Switch to ${viewMode === 'visual' ? 'Accessible List' : 'Visual SVG'} view`}
        >
          {viewMode === 'visual' ? '📋 List View' : '🌿 Visual Tree'}
        </button>
      </header>

      {/* Specialization Prompt Banner */}
      {specializationAvailable && !selectedSpecialization && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: '#2B2319',
            border: '1px solid #E98A4B',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '12px',
            color: '#FFD38A',
            fontSize: '13px',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }} aria-hidden="true">
            ✨
          </span>
          <div>
            <strong>A Path is Ready!</strong>
            <div style={{ fontSize: '12px', color: '#F0E7D3' }}>
              Select Scholar or Explorer below to commit your Mind specialization.
            </div>
          </div>
        </div>
      )}

      {/* Selected Specialization Confirmation Badge */}
      {selectedSpecialization && (
        <div
          style={{
            backgroundColor: '#1F2A1E',
            border: '1px solid #9FBA87',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '12px',
            color: '#D9E3B2',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span aria-hidden="true">🌱</span>
          <span>
            Specialization Chosen:{' '}
            <strong style={{ textTransform: 'capitalize', color: '#F0E7D3' }}>
              {selectedSpecialization}
            </strong>
          </span>
        </div>
      )}

      {/* Main View Display */}
      {viewMode === 'visual' ? (
        <div className="root-svg-wrapper">
          <MindBranchSvg
            firstThoughtState={firstThoughtState}
            scholarState={scholarState}
            explorerState={explorerState}
            scholarsCrownState={scholarsCrownState}
            explorersCompassState={explorersCompassState}
            selectedSpecialization={selectedSpecialization}
          />
          <div className="root-nodes-layer">
            {nodes.map((node: MindNodeInfo) => (
              <RootNodeButton
                key={node.id}
                node={node}
                onSelect={
                  node.specializationKey && onSelectSpecialization
                    ? () => onSelectSpecialization(node.specializationKey!)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <MindRootList
          nodes={nodes}
          mindXP={mindXP}
          selectedSpecialization={selectedSpecialization}
          onSelectSpecialization={onSelectSpecialization}
        />
      )}
    </section>
  );
};
