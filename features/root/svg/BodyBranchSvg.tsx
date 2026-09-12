import React from 'react';
import { NodeState, SpecializationId } from '../types';

export interface BodyBranchSvgProps {
  originState: NodeState;
  enduranceState: NodeState;
  mobilityState: NodeState;
  enduranceCrestState: NodeState;
  mobilityCrestState: NodeState;
  selectedSpecialization: SpecializationId | null;
}

export const BodyBranchSvg: React.FC<BodyBranchSvgProps> = ({
  originState,
  enduranceState,
  mobilityState,
  enduranceCrestState,
  mobilityCrestState,
  selectedSpecialization,
}: BodyBranchSvgProps) => {
  const getPathColor = (fromState: NodeState, toState: NodeState, isSelectedPath?: boolean): string => {
    if (isSelectedPath || (toState === 'selected' || toState === 'unlocked')) {
      return '#E98A4B'; // --color-ember / Body copper accent
    }
    if (toState === 'available') {
      return '#FFD38A'; // Ember core glow
    }
    if (fromState === 'unlocked' && toState === 'locked') {
      return 'rgba(233, 138, 75, 0.25)';
    }
    return '#2A322A';
  };

  const getPathWidth = (toState: NodeState, isSelectedPath?: boolean): number => {
    if (isSelectedPath || toState === 'selected') return 4.5;
    if (toState === 'unlocked' || toState === 'available') return 3.5;
    return 2;
  };

  const isEnduranceChosen = selectedSpecialization === 'endurance';
  const isMobilityChosen = selectedSpecialization === 'mobility';

  return (
    <svg
      viewBox="0 0 360 480"
      className="root-svg"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="bodyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Trunk Base Connection */}
      <path
        d="M 180 480 Q 180 320 180 120"
        fill="none"
        stroke="#2B2319"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Path 1: Trunk to Rooted Stance */}
      <path
        className="root-path"
        d="M 180 480 L 180 80"
        fill="none"
        stroke={getPathColor('unlocked', originState)}
        strokeWidth={getPathWidth(originState)}
        strokeLinecap="round"
        filter={originState !== 'locked' ? 'url(#bodyGlow)' : undefined}
      />

      {/* Path 2A: Rooted Stance -> Endurance (Left Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 100 150 100 220"
        fill="none"
        stroke={getPathColor(originState, enduranceState, isEnduranceChosen)}
        strokeWidth={getPathWidth(enduranceState, isEnduranceChosen)}
        strokeDasharray={enduranceState === 'locked' && !isEnduranceChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={isEnduranceChosen || enduranceState === 'available' ? 'url(#bodyGlow)' : undefined}
      />

      {/* Path 2B: Rooted Stance -> Mobility (Right Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 260 150 260 220"
        fill="none"
        stroke={getPathColor(originState, mobilityState, isMobilityChosen)}
        strokeWidth={getPathWidth(mobilityState, isMobilityChosen)}
        strokeDasharray={mobilityState === 'locked' && !isMobilityChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={isMobilityChosen || mobilityState === 'available' ? 'url(#bodyGlow)' : undefined}
      />

      {/* Path 3A: Endurance -> Endurance Aegis */}
      <path
        className="root-path"
        d="M 100 220 C 100 290 100 320 100 370"
        fill="none"
        stroke={getPathColor(enduranceState, enduranceCrestState, isEnduranceChosen)}
        strokeWidth={getPathWidth(enduranceCrestState, isEnduranceChosen)}
        strokeDasharray={enduranceCrestState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={enduranceCrestState !== 'locked' ? 'url(#bodyGlow)' : undefined}
      />

      {/* Path 3B: Mobility -> Mobility Wing */}
      <path
        className="root-path"
        d="M 260 220 C 260 290 260 320 260 370"
        fill="none"
        stroke={getPathColor(mobilityState, mobilityCrestState, isMobilityChosen)}
        strokeWidth={getPathWidth(mobilityCrestState, isMobilityChosen)}
        strokeDasharray={mobilityCrestState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={mobilityCrestState !== 'locked' ? 'url(#bodyGlow)' : undefined}
      />

      {/* Flourishes */}
      <circle cx="180" cy="80" r="4" fill="#E98A4B" opacity="0.8" />
      <circle cx="100" cy="220" r="3" fill={enduranceState !== 'locked' ? '#E98A4B' : '#3B463B'} />
      <circle cx="260" cy="220" r="3" fill={mobilityState !== 'locked' ? '#E98A4B' : '#3B463B'} />
    </svg>
  );
};
