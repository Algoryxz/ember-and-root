import React from 'react';
import { AttributeId } from './types';
import { BRANCH_CONFIGS } from './config';
import { TOKENS } from './tokens';

export interface RootTabsProps {
  selectedAttribute: AttributeId;
  onSelectAttribute: (attribute: AttributeId) => void;
}

const ATTRIBUTES: AttributeId[] = ['mind', 'body', 'will', 'craft'];

export const RootTabs: React.FC<RootTabsProps> = ({
  selectedAttribute,
  onSelectAttribute,
}: RootTabsProps) => {
  return (
    <nav
      aria-label="Root Attribute Navigation"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        marginBottom: '16px',
        backgroundColor: TOKENS.color.surface,
        padding: '6px',
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${TOKENS.color.borderDefault}`,
      }}
    >
      {ATTRIBUTES.map((attr) => {
        const config = BRANCH_CONFIGS[attr];
        const isSelected = selectedAttribute === attr;

        return (
          <button
            key={attr}
            type="button"
            onClick={() => onSelectAttribute(attr)}
            style={{
              minHeight: '44px',
              padding: '8px 4px',
              borderRadius: TOKENS.radius.md,
              border: isSelected ? `1px solid ${config.accentColor}` : '1px solid transparent',
              backgroundColor: isSelected ? TOKENS.color.bg : 'transparent',
              color: isSelected ? config.accentColor : TOKENS.color.textSecondary,
              fontFamily: TOKENS.font.ui,
              fontSize: '13px',
              fontWeight: isSelected ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
            }}
            aria-selected={isSelected}
            aria-label={`${config.title}`}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: config.accentColor,
                display: 'inline-block',
                opacity: isSelected ? 1 : 0.5,
              }}
              aria-hidden="true"
            />
            <span style={{ textTransform: 'capitalize' }}>{attr}</span>
          </button>
        );
      })}
    </nav>
  );
};
