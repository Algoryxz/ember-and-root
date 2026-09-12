import React from 'react';
import { NodeState, SpecializationId } from '../types';

interface MindBranchSvgProps {
  firstThoughtState: NodeState;
  scholarState: NodeState;
  explorerState: NodeState;
  scholarsCrownState: NodeState;
  explorersCompassState: NodeState;
  selectedSpecialization: SpecializationId | null;
}

export const MindBranchSvg: React.FC<MindBranchSvgProps> = ({
  firstThoughtState,
  scholarState,
  explorerState,
  scholarsCrownState,
  explorersCompassState,
  selectedSpecialization,
}) => {
  // Path colors based on states
  const getPathColor = (fromState: NodeState, toState: NodeState, isSelectedPath?: boolean) => {
    if (isSelectedPath || (toState === 'selected' || toState === 'unlocked')) {
      return '#9FBA87'; // --color-root
    }
    if (toState === 'available') {
      return '#E98A4B'; // --color-ember
    }
    if (fromState === 'unlocked' && toState === 'locked') {
      return 'rgba(159, 186, 135, 0.25)'; // Faint unchosen/locked path
    }
    return '#2A322A'; // Dark locked path
  };

  const getPathWidth = (toState: NodeState, isSelectedPath?: boolean) => {
    if (isSelectedPath || toState === 'selected') return 4.5;
    if (toState === 'unlocked' || toState === 'available') return 3.5;
    return 2;
  };

  const isScholarChosen = selectedSpecialization === 'scholar';
  const isExplorerChosen = selectedSpecialization === 'explorer';

  return (
    <svg
      viewBox="0 0 360 480"
      className="root-svg"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow Filters */}
        <filter id="rootGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="emberGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Trunk Base Connection */}
      <path
        d="M 180 480 Q 180 320 180 120"
        fill="none"
        stroke="#1D2A1C"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Path 1: Trunk to First Thought (Top Origin Node) */}
      <path
        className="root-path"
        d="M 180 480 L 180 80"
        fill="none"
        stroke={getPathColor('unlocked', firstThoughtState)}
        strokeWidth={getPathWidth(firstThoughtState)}
        strokeLinecap="round"
        filter={firstThoughtState !== 'locked' ? 'url(#rootGlow)' : undefined}
      />

      {/* Path 2A: First Thought -> Scholar (Left Fork Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 100 150 100 220"
        fill="none"
        stroke={getPathColor(
          firstThoughtState,
          scholarState,
          isScholarChosen
        )}
        strokeWidth={getPathWidth(scholarState, isScholarChosen)}
        strokeDasharray={scholarState === 'locked' && !isScholarChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={scholarState === 'available' ? 'url(#emberGlow)' : isScholarChosen ? 'url(#rootGlow)' : undefined}
      />

      {/* Path 2B: First Thought -> Explorer (Right Fork Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 260 150 260 220"
        fill="none"
        stroke={getPathColor(
          firstThoughtState,
          explorerState,
          isExplorerChosen
        )}
        strokeWidth={getPathWidth(explorerState, isExplorerChosen)}
        strokeDasharray={explorerState === 'locked' && !isExplorerChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={explorerState === 'available' ? 'url(#emberGlow)' : isExplorerChosen ? 'url(#rootGlow)' : undefined}
      />

      {/* Path 3A: Scholar -> Scholar's Crown (Left Crest Branch) */}
      <path
        className="root-path"
        d="M 100 220 C 100 290 100 320 100 370"
        fill="none"
        stroke={getPathColor(scholarState, scholarsCrownState, isScholarChosen)}
        strokeWidth={getPathWidth(scholarsCrownState, isScholarChosen)}
        strokeDasharray={scholarsCrownState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={scholarsCrownState !== 'locked' ? 'url(#rootGlow)' : undefined}
      />

      {/* Path 3B: Explorer -> Explorer's Compass (Right Crest Branch) */}
      <path
        className="root-path"
        d="M 260 220 C 260 290 260 320 260 370"
        fill="none"
        stroke={getPathColor(explorerState, explorersCompassState, isExplorerChosen)}
        strokeWidth={getPathWidth(explorersCompassState, isExplorerChosen)}
        strokeDasharray={explorersCompassState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={explorersCompassState !== 'locked' ? 'url(#rootGlow)' : undefined}
      />

      {/* Decorative Branch Flourishes */}
      <circle cx="180" cy="80" r="4" fill="#9FBA87" opacity="0.6" />
      <circle cx="100" cy="220" r="3" fill={scholarState !== 'locked' ? '#9FBA87' : '#3B463B'} />
      <circle cx="260" cy="220" r="3" fill={explorerState !== 'locked' ? '#9FBA87' : '#3B463B'} />
    </svg>
  );
};
