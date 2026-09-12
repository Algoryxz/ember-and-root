import React from 'react';
import { NodeState, Specialization } from '../types';

export interface MindBranchSvgProps {
  firstThoughtState: NodeState;
  scholarState: NodeState;
  explorerState: NodeState;
  scholarsCrownState: NodeState;
  explorersCompassState: NodeState;
  selectedSpecialization: Specialization | null;
}

export const MindBranchSvg: React.FC<MindBranchSvgProps> = ({
  firstThoughtState,
  scholarState,
  explorerState,
  scholarsCrownState,
  explorersCompassState,
  selectedSpecialization,
}: MindBranchSvgProps) => {
  const getPathColor = (fromState: NodeState, toState: NodeState, isSelectedPath?: boolean): string => {
    if (isSelectedPath || (toState === 'selected' || toState === 'unlocked')) {
      return '#9FBA87';
    }
    if (toState === 'available') {
      return '#E98A4B';
    }
    if (fromState === 'unlocked' && toState === 'locked') {
      return 'rgba(159, 186, 135, 0.25)';
    }
    return '#2A322A';
  };

  const getPathWidth = (toState: NodeState, isSelectedPath?: boolean): number => {
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

      {/* Path 1: Trunk to First Thought */}
      <path
        className="root-path"
        d="M 180 480 L 180 80"
        fill="none"
        stroke={getPathColor('unlocked', firstThoughtState)}
        strokeWidth={getPathWidth(firstThoughtState)}
        strokeLinecap="round"
        filter={firstThoughtState !== 'locked' ? 'url(#rootGlow)' : undefined}
      />

      {/* Path 2A: First Thought -> Scholar */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 100 150 100 220"
        fill="none"
        stroke={getPathColor(firstThoughtState, scholarState, isScholarChosen)}
        strokeWidth={getPathWidth(scholarState, isScholarChosen)}
        strokeDasharray={scholarState === 'locked' && !isScholarChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={scholarState === 'available' ? 'url(#emberGlow)' : isScholarChosen ? 'url(#rootGlow)' : undefined}
      />

      {/* Path 2B: First Thought -> Explorer */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 260 150 260 220"
        fill="none"
        stroke={getPathColor(firstThoughtState, explorerState, isExplorerChosen)}
        strokeWidth={getPathWidth(explorerState, isExplorerChosen)}
        strokeDasharray={explorerState === 'locked' && !isExplorerChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={explorerState === 'available' ? 'url(#emberGlow)' : isExplorerChosen ? 'url(#rootGlow)' : undefined}
      />

      {/* Path 3A: Scholar -> Scholar's Crown */}
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

      {/* Path 3B: Explorer -> Explorer's Compass */}
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

      {/* Authored Crest Artwork: Scholar's Crown Emblem at (100, 370) */}
      <g transform="translate(100, 370)" opacity={scholarsCrownState !== 'locked' ? 1 : 0.4}>
        <path
          d="M -14 0 Q -7 -14 0 -6 Q 7 -14 14 0 L 10 10 L -10 10 Z"
          fill={scholarsCrownState !== 'locked' ? '#9FBA87' : '#2A322A'}
          stroke="#D9E3B2"
          strokeWidth="1.5"
        />
        <circle cx="0" cy="-8" r="2.5" fill="#FFD38A" />
      </g>

      {/* Authored Crest Artwork: Explorer's Compass Emblem at (260, 370) */}
      <g transform="translate(260, 370)" opacity={explorersCompassState !== 'locked' ? 1 : 0.4}>
        <circle cx="0" cy="0" r="12" fill="none" stroke="#9FBA87" strokeWidth="1.5" />
        <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="#E98A4B" />
        <path d="M -10 0 L 0 3 L 10 0 L 0 -3 Z" fill="#D9E3B2" />
      </g>

      {/* Flourishes */}
      <circle cx="180" cy="80" r="4" fill="#9FBA87" opacity="0.6" />
      <circle cx="100" cy="220" r="3" fill={scholarState !== 'locked' ? '#9FBA87' : '#3B463B'} />
      <circle cx="260" cy="220" r="3" fill={explorerState !== 'locked' ? '#9FBA87' : '#3B463B'} />
    </svg>
  );
};
