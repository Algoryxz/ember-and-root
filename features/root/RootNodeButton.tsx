import React from 'react';
import { MindNodeInfo } from './types';

export interface RootNodeButtonProps {
  node: MindNodeInfo;
  onSelect?: () => void;
}

export const RootNodeButton: React.FC<RootNodeButtonProps> = ({ node, onSelect }: RootNodeButtonProps) => {
  const isInteractive = node.state === 'available' && !!onSelect;

  const getAriaLabel = (): string => {
    let statusText = '';
    switch (node.state) {
      case 'unlocked':
        statusText = 'Unlocked';
        break;
      case 'available':
        statusText = 'Available for specialization! Select to choose this path.';
        break;
      case 'selected':
        statusText = 'Chosen Specialization';
        break;
      case 'locked':
      default:
        statusText = `Locked (Requires ${node.xpRequired} Mind XP)`;
        break;
    }
    return `${node.label} (${node.subtitle}) - ${statusText}. ${node.description}`;
  };

  return (
    <button
      type="button"
      className={`root-node-button state-${node.state}`}
      style={{
        left: `${node.coordinates.percentX}%`,
        top: `${node.coordinates.percentY}%`,
      }}
      onClick={isInteractive ? onSelect : undefined}
      disabled={node.state === 'locked'}
      aria-label={getAriaLabel()}
      title={`${node.label} - ${node.state.toUpperCase()}`}
    >
      <span className="node-indicator" aria-hidden="true" />
      <span className="node-label-container">
        <span className="node-title">{node.label}</span>
        <span className="node-subtitle">{node.subtitle}</span>
      </span>
    </button>
  );
};
