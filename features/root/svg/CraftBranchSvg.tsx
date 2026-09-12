import React from 'react';
import { NodeState, SpecializationId } from '../types';

export interface CraftBranchSvgProps {
  originState: NodeState;
  builderState: NodeState;
  artisanState: NodeState;
  builderCrestState: NodeState;
  artisanCrestState: NodeState;
  selectedSpecialization: SpecializationId | null;
}

export const CraftBranchSvg: React.FC<CraftBranchSvgProps> = ({
  originState,
  builderState,
  artisanState,
  builderCrestState,
  artisanCrestState,
  selectedSpecialization,
}: CraftBranchSvgProps) => {
  const getPathColor = (fromState: NodeState, toState: NodeState, isSelectedPath?: boolean): string => {
    if (isSelectedPath || (toState === 'selected' || toState === 'unlocked')) {
      return '#D9E3B2'; // --color-root-mature / Craft pale gold accent
    }
    if (toState === 'available') {
      return '#E98A4B';
    }
    if (fromState === 'unlocked' && toState === 'locked') {
      return 'rgba(217, 227, 178, 0.25)';
    }
    return '#2A322A';
  };

  const getPathWidth = (toState: NodeState, isSelectedPath?: boolean): number => {
    if (isSelectedPath || toState === 'selected') return 4.5;
    if (toState === 'unlocked' || toState === 'available') return 3.5;
    return 2;
  };

  const isBuilderChosen = selectedSpecialization === 'builder';
  const isArtisanChosen = selectedSpecialization === 'artisan';

  return (
    <svg
      viewBox="0 0 360 480"
      className="root-svg"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="craftGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Trunk Base Connection */}
      <path
        d="M 180 480 Q 180 320 180 120"
        fill="none"
        stroke="#272D24"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Path 1: Trunk to First Spark */}
      <path
        className="root-path"
        d="M 180 480 L 180 80"
        fill="none"
        stroke={getPathColor('unlocked', originState)}
        strokeWidth={getPathWidth(originState)}
        strokeLinecap="round"
        filter={originState !== 'locked' ? 'url(#craftGlow)' : undefined}
      />

      {/* Path 2A: First Spark -> Builder (Left Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 100 150 100 220"
        fill="none"
        stroke={getPathColor(originState, builderState, isBuilderChosen)}
        strokeWidth={getPathWidth(builderState, isBuilderChosen)}
        strokeDasharray={builderState === 'locked' && !isBuilderChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={isBuilderChosen || builderState === 'available' ? 'url(#craftGlow)' : undefined}
      />

      {/* Path 2B: First Spark -> Artisan (Right Curve) */}
      <path
        className="root-path"
        d="M 180 80 C 180 140 260 150 260 220"
        fill="none"
        stroke={getPathColor(originState, artisanState, isArtisanChosen)}
        strokeWidth={getPathWidth(artisanState, isArtisanChosen)}
        strokeDasharray={artisanState === 'locked' && !isArtisanChosen ? '4 4' : undefined}
        strokeLinecap="round"
        filter={isArtisanChosen || artisanState === 'available' ? 'url(#craftGlow)' : undefined}
      />

      {/* Path 3A: Builder -> Builder's Keystone */}
      <path
        className="root-path"
        d="M 100 220 C 100 290 100 320 100 370"
        fill="none"
        stroke={getPathColor(builderState, builderCrestState, isBuilderChosen)}
        strokeWidth={getPathWidth(builderCrestState, isBuilderChosen)}
        strokeDasharray={builderCrestState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={builderCrestState !== 'locked' ? 'url(#craftGlow)' : undefined}
      />

      {/* Path 3B: Artisan -> Artisan's Anvil */}
      <path
        className="root-path"
        d="M 260 220 C 260 290 260 320 260 370"
        fill="none"
        stroke={getPathColor(artisanState, artisanCrestState, isArtisanChosen)}
        strokeWidth={getPathWidth(artisanCrestState, isArtisanChosen)}
        strokeDasharray={artisanCrestState === 'locked' ? '4 4' : undefined}
        strokeLinecap="round"
        filter={artisanCrestState !== 'locked' ? 'url(#craftGlow)' : undefined}
      />

      {/* Flourishes */}
      <circle cx="180" cy="80" r="4" fill="#D9E3B2" opacity="0.8" />
      <circle cx="100" cy="220" r="3" fill={builderState !== 'locked' ? '#D9E3B2' : '#3B463B'} />
      <circle cx="260" cy="220" r="3" fill={artisanState !== 'locked' ? '#D9E3B2' : '#3B463B'} />
    </svg>
  );
};
