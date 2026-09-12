import React from 'react';
import { AttributeId, RootNodeInfo, SpecializationId } from './types';
import { BRANCH_CONFIGS } from './config';

export interface RootListProps {
  attribute: AttributeId;
  nodes: RootNodeInfo[];
  xp: number;
  selectedSpecialization: SpecializationId | null;
  onSelectSpecialization?: (attribute: AttributeId, spec: SpecializationId) => void;
}

export const RootList: React.FC<RootListProps> = ({
  attribute,
  nodes,
  xp,
  selectedSpecialization,
  onSelectSpecialization,
}: RootListProps) => {
  const config = BRANCH_CONFIGS[attribute];

  return (
    <div
      className="root-list-fallback"
      role="region"
      aria-label={`${config.title} Linear Accessible List`}
      style={{
        padding: '16px',
        backgroundColor: '#1D231D',
        borderRadius: '8px',
        border: '1px solid #2B352B',
        marginTop: '12px',
      }}
    >
      <header style={{ marginBottom: '12px' }}>
        <h3
          style={{
            fontFamily: 'Fraunces, serif',
            margin: '0 0 4px 0',
            color: '#F0E7D3',
            fontSize: '18px',
          }}
        >
          {config.title} Progression
        </h3>
        <p style={{ margin: 0, color: '#B9BEAC', fontSize: '13px' }}>
          Current {attribute.toUpperCase()} XP:{' '}
          <strong style={{ color: config.accentColor }}>{xp} XP</strong>
          {selectedSpecialization && (
            <span>
              {' '}
              | Specialization:{' '}
              <strong style={{ color: '#D9E3B2', textTransform: 'capitalize' }}>
                {selectedSpecialization}
              </strong>
            </span>
          )}
        </p>
      </header>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {nodes.map((node: RootNodeInfo) => {
          const isInteractive =
            node.state === 'available' && node.specializationKey && onSelectSpecialization;

          return (
            <li
              key={node.id}
              style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: node.state === 'selected' ? '#263323' : '#141713',
                border:
                  node.state === 'available'
                    ? '1px solid #E98A4B'
                    : node.state === 'selected'
                    ? `1px solid ${config.accentColor}`
                    : '1px solid #2A322A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#F0E7D3', fontSize: '14px' }}>{node.label}</strong>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      backgroundColor:
                        node.state === 'selected'
                          ? config.accentColor
                          : node.state === 'available'
                          ? '#E98A4B'
                          : node.state === 'unlocked'
                          ? '#3B463B'
                          : '#222822',
                      color: node.state === 'selected' || node.state === 'available' ? '#141713' : '#B9BEAC',
                    }}
                  >
                    {node.state}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontFamily: 'Fraunces, serif',
                    fontStyle: 'italic',
                    color: '#B9BEAC',
                    marginTop: '2px',
                  }}
                >
                  {node.subtitle} — {node.description}
                </div>
              </div>

              {isInteractive && (
                <button
                  type="button"
                  onClick={() => onSelectSpecialization(attribute, node.specializationKey!)}
                  style={{
                    backgroundColor: '#E98A4B',
                    color: '#141713',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  Choose {node.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
