import React, { useState } from 'react';
import { AttributeId, BranchState, NodeState, RootNodeInfo, SpecializationId } from './types';
import { BRANCH_CONFIGS } from './config';
import { BranchSvgRenderer } from './svg/BranchSvgRenderer';
import { RootNodeButton } from './RootNodeButton';
import { RootList } from './RootList';
import './root.css';

export interface RootBranchProps {
  attribute: AttributeId;
  state: BranchState;
  onSelectSpecialization?: (attribute: AttributeId, spec: SpecializationId) => void;
  className?: string;
}

export const RootBranch: React.FC<RootBranchProps> = ({
  attribute,
  state,
  onSelectSpecialization,
  className = '',
}: RootBranchProps) => {
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  const config = BRANCH_CONFIGS[attribute];
  const { xp, selectedSpecialization, specializationAvailable } = state;

  // Node state derivations
  const originState: NodeState = xp >= 1 ? 'unlocked' : 'locked';

  const spec1 = config.specializations[0];
  const spec2 = config.specializations[1];

  let spec1State: NodeState = 'locked';
  let spec2State: NodeState = 'locked';

  if (selectedSpecialization === spec1.id) {
    spec1State = 'selected';
    spec2State = 'locked';
  } else if (selectedSpecialization === spec2.id) {
    spec2State = 'selected';
    spec1State = 'locked';
  } else if (specializationAvailable) {
    spec1State = 'available';
    spec2State = 'available';
  }

  const spec1CrestState: NodeState =
    selectedSpecialization === spec1.id ? 'available' : 'locked';

  const spec2CrestState: NodeState =
    selectedSpecialization === spec2.id ? 'available' : 'locked';

  // Node definitions with coordinates matching SVG viewBox 360x480
  const nodes: RootNodeInfo[] = [
    {
      id: config.originNode.id,
      label: config.originNode.label,
      subtitle: config.originNode.subtitle,
      type: 'origin',
      state: originState,
      xpRequired: 1,
      description: config.originNode.description,
      coordinates: { x: 180, y: 80, percentX: 50, percentY: 16.6 },
    },
    {
      id: spec1.id,
      label: spec1.label,
      subtitle: spec1.subtitle,
      type: 'specialization',
      specializationKey: spec1.id,
      state: spec1State,
      xpRequired: 80,
      description: spec1.description,
      coordinates: { x: 100, y: 220, percentX: 27.7, percentY: 45.8 },
    },
    {
      id: spec2.id,
      label: spec2.label,
      subtitle: spec2.subtitle,
      type: 'specialization',
      specializationKey: spec2.id,
      state: spec2State,
      xpRequired: 80,
      description: spec2.description,
      coordinates: { x: 260, y: 220, percentX: 72.2, percentY: 45.8 },
    },
    {
      id: spec1.crest.id,
      label: spec1.crest.label,
      subtitle: spec1.crest.subtitle,
      type: 'crest',
      state: spec1CrestState,
      xpRequired: 160,
      description: spec1.crest.description,
      coordinates: { x: 100, y: 370, percentX: 27.7, percentY: 77.0 },
    },
    {
      id: spec2.crest.id,
      label: spec2.crest.label,
      subtitle: spec2.crest.subtitle,
      type: 'crest',
      state: spec2CrestState,
      xpRequired: 160,
      description: spec2.crest.description,
      coordinates: { x: 260, y: 370, percentX: 72.2, percentY: 77.0 },
    },
  ];

  return (
    <section
      className={`root-branch-container ${className}`}
      aria-label={`${config.title}`}
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
                backgroundColor: config.accentColor,
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            {config.title}
          </h2>
          <span style={{ fontSize: '12px', color: '#B9BEAC' }}>
            {config.subtitle} ({xp} XP)
          </span>
        </div>

        {/* View Mode Switcher */}
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
          aria-label={`Switch to ${viewMode === 'visual' ? 'Accessible List' : 'Visual SVG'} view for ${config.title}`}
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
              Select {spec1.label} or {spec2.label} below to commit your {attribute} specialization.
            </div>
          </div>
        </div>
      )}

      {/* Specialization Confirmation Badge */}
      {selectedSpecialization && (
        <div
          style={{
            backgroundColor: '#1F2A1E',
            border: `1px solid ${config.accentColor}`,
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
          <BranchSvgRenderer
            attribute={attribute}
            nodes={nodes}
            selectedSpecialization={selectedSpecialization}
          />
          <div className="root-nodes-layer">
            {nodes.map((node: RootNodeInfo) => (
              <RootNodeButton
                key={node.id}
                node={node}
                onSelect={
                  node.specializationKey && onSelectSpecialization
                    ? () => onSelectSpecialization(attribute, node.specializationKey!)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <RootList
          attribute={attribute}
          nodes={nodes}
          xp={xp}
          selectedSpecialization={selectedSpecialization}
          onSelectSpecialization={onSelectSpecialization}
        />
      )}
    </section>
  );
};
