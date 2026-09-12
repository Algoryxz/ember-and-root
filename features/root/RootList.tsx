import React from 'react';
import { AttributeId, RootNodeInfo, SpecializationId } from './types';
import { BRANCH_CONFIGS } from './config';
import { TOKENS } from './tokens';

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
        backgroundColor: TOKENS.color.surface,
        borderRadius: TOKENS.radius.lg,
        border: `1px solid ${TOKENS.color.borderDefault}`,
        marginTop: '12px',
      }}
    >
      <header style={{ marginBottom: '12px' }}>
        <h3
          style={{
            fontFamily: TOKENS.font.display,
            margin: '0 0 4px 0',
            color: TOKENS.color.textPrimary,
            fontSize: '18px',
          }}
        >
          {config.title} Progression
        </h3>
        <p style={{ margin: 0, color: TOKENS.color.textSecondary, fontSize: '13px' }}>
          Current {attribute.toUpperCase()} XP:{' '}
          <strong style={{ color: config.accentColor }}>{xp} XP</strong>
          {selectedSpecialization && (
            <span>
              {' '}
              | Specialization:{' '}
              <strong style={{ color: TOKENS.color.rootMature, textTransform: 'capitalize' }}>
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
                borderRadius: TOKENS.radius.md,
                backgroundColor: node.state === 'selected' ? TOKENS.color.surfaceHover : TOKENS.color.bg,
                border:
                  node.state === 'available'
                    ? `1px solid ${TOKENS.color.ember}`
                    : node.state === 'selected'
                    ? `1px solid ${config.accentColor}`
                    : `1px solid ${TOKENS.color.nodeLocked}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: TOKENS.color.textPrimary, fontSize: '14px' }}>{node.label}</strong>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: TOKENS.radius.sm,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      backgroundColor:
                        node.state === 'selected'
                          ? config.accentColor
                          : node.state === 'available'
                          ? TOKENS.color.ember
                          : node.state === 'unlocked'
                          ? TOKENS.color.borderLocked
                          : TOKENS.color.nodeLocked,
                      color: node.state === 'selected' || node.state === 'available' ? TOKENS.color.bg : TOKENS.color.textSecondary,
                    }}
                  >
                    {node.state}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontFamily: TOKENS.font.display,
                    fontStyle: 'italic',
                    color: TOKENS.color.textSecondary,
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
                    backgroundColor: TOKENS.color.ember,
                    color: TOKENS.color.bg,
                    border: 'none',
                    borderRadius: TOKENS.radius.md,
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
