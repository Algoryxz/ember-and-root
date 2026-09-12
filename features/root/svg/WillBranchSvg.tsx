import React from 'react';
import { NodeState, SpecializationId } from '../types';

export interface WillBranchSvgProps {
  originState: NodeState;
  focusState: NodeState;
  courageState: NodeState;
  focusCrestState: NodeState;
  courageCrestState: NodeState;
  selectedSpecialization: SpecializationId | null;
}

export const WillBranchSvg: React.FC<WillBranchSvgProps> = ({
  originState,
  focusState,
  courageState,
  focusCrestState,
  courageCrestState,
  selectedSpecialization,
}: WillBranchSvgProps) => {
  const getPathColor = (fromState: NodeState, toState: NodeState, isSelectedPath?: boolean): string => {
    if (isSelectedPath || (toState === 'selected' || toState === 'unlocked')) {
      return '#FFD38A'; // --color-ember-core / Will gold accent
    }
    if (toState === 'available') {
      return '#E98A4B';
    }
    if (fromState === 'unlocked' && toState === 'locked') {
      return 'rgba(255, 211, 138, 0.25)';
    }
    return '#2A322A';
  };

  const getPathWidth = (toState: NodeState, isSelectedPath?: boolean): number => {
    if (isSelectedPath || toState === 'selected') return 4.5;
    if (toState === 'unlocked' || toState === 'available') return 3.5;
    return 2;
  };

  const isFocusChosen = selectedSpecialization === 'focus';
  const isCourageChosen = selectedSpecialization === 'courage';

  return (
    <svg
      viewBox="0 0 360 480"
      className="root-svg"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="willGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Trunk Base Connection */}
      <path
        d="M 180 480 Q 180 320 180 120"
        fill="none"
        stroke="#332B1B"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Path 1: Trunk to Iron Intent */}
      <path
        className="root-path"
        d="M 180 480 L 180 80"
        fill="none"
        stroke={getPathColor('unlocked', originState)}
        strokeWidth={getPathWidth(originState)}
        strokeLinecap="round"
        filter={originState !== 'locked' ? 'url(#willGlow)' : undefined}
      />

      {/* Path 2A: Iron Intent -> Focus (Left Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 100 150 100 220"
        fill="none"
        stroke={getPathColor(originState, focusState, isFocusChosen)}
        strokeWidth={getPathWidth(focusState, isFocusChosen)}
        strokeDasharray={focusState === 'locked' && !isFocusChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={isFocusChosen || focusState === 'available' ? 'url(#willGlow)' : undefined}
      />

      {/* Path 2B: Iron Intent -> Courage (Right Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 260 150 260 220"
        fill="none"
        stroke={getPathColor(originState, courageState, isCourageChosen)}
        strokeWidth={getPathWidth(courageState, isCourageChosen)}
        strokeDasharray={courageState === 'locked' && !isCourageChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={isCourageChosen || courageState === 'available' ? 'url(#willGlow)' : undefined}
      />

      {/* Path 3A: Focus -> Focus Prism */}
      <path
        className="root-path"
        d="M 100 220 C 100 290 100 320 100 370"
        fill="none"
        stroke={getPathColor(focusState, focusCrestState, isFocusChosen)}
        strokeWidth={getPathWidth(focusCrestState, isFocusChosen)}
        strokeDasharray={focusCrestState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={focusCrestState !== 'locked' ? 'url(#willGlow)' : undefined}
      />

      {/* Path 3B: Courage -> Courage Shield */}
      <path
        className="root-path"
        d="M 260 220 C 260 290 260 320 260 370"
        fill="none"
        stroke={getPathColor(courageState, courageCrestState, isCourageChosen)}
        strokeWidth={getPathWidth(courageCrestState, isCourageChosen)}
        strokeDasharray={courageCrestState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={courageCrestState !== 'locked' ? 'url(#willGlow)' : undefined}
      />

      {/* Flourishes */}
      <circle cx="180" cy="80" r="4" fill="#FFD38A" opacity="0.8" />
      <circle cx="100" cy="220" r="3" fill={focusState !== 'locked' ? '#FFD38A' : '#3B463B'} />
      <circle cx="260" cy="220" r="3" fill={courageState !== 'locked' ? '#FFD38A' : '#3B463B'} />
    </svg>
  );
};
