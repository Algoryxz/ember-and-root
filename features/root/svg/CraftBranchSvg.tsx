import React from 'react';
import { NodeState, Specialization } from '../types';

export interface CraftBranchSvgProps {
  originState: NodeState;
  builderState: NodeState;
  artisanState: NodeState;
  builderCrestState: NodeState;
  artisanCrestState: NodeState;
  selectedSpecialization: Specialization | null;
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
      return '#D9E3B2';
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
        <filter id="emberGlowCraft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Layer 0: Botanical Plate Grid & Elevation Scale Margin */}
      <g className="botanical-plate-background" opacity="0.45">
        {/* Horizontal Threshold Watermarks */}
        <line x1="20" y1="80" x2="340" y2="80" stroke="rgba(217, 227, 178, 0.15)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="220" x2="340" y2="220" stroke="rgba(217, 227, 178, 0.15)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="370" x2="340" y2="370" stroke="rgba(217, 227, 178, 0.15)" strokeDasharray="2 4" strokeWidth="1" />

        {/* Left Elevation Scale */}
        <line x1="24" y1="60" x2="24" y2="440" stroke="rgba(217, 227, 178, 0.25)" strokeWidth="1" />
        <line x1="20" y1="80" x2="28" y2="80" stroke="#D9E3B2" strokeWidth="1.5" />
        <line x1="20" y1="220" x2="28" y2="220" stroke="#D9E3B2" strokeWidth="1.5" />
        <line x1="20" y1="370" x2="28" y2="370" stroke="#D9E3B2" strokeWidth="1.5" />

        <text x="14" y="83" fill="#D9E3B2" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">1 XP</text>
        <text x="14" y="223" fill="#D9E3B2" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">80 XP</text>
        <text x="14" y="373" fill="#D9E3B2" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">160 XP</text>

        {/* Botanical Specimen Plate Header Marker */}
        <text x="180" y="24" fill="#D9E3B2" fontSize="8" fontFamily="Fraunces" fontStyle="italic" textAnchor="middle" letterSpacing="0.1em">
          SPECIMEN NO. IV · RAMUS FABRICA (CRAFT)
        </text>
      </g>

      {/* Layer 1: Base Soil Substrate & Fibrous Rootlets */}
      <g className="root-fibrous-base">
        <path d="M 180 480 Q 150 435 110 445" stroke="rgba(217, 227, 178, 0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 210 435 250 445" stroke="rgba(217, 227, 178, 0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 170 420 140 410" stroke="rgba(217, 227, 178, 0.2)" strokeWidth="1" fill="none" />
        <path d="M 180 480 Q 190 420 220 410" stroke="rgba(217, 227, 178, 0.2)" strokeWidth="1" fill="none" />

        {/* Soil Substrate Hatching */}
        <line x1="130" y1="465" x2="230" y2="465" stroke="rgba(217, 227, 178, 0.15)" strokeWidth="1" strokeDasharray="3 6" />
        <line x1="110" y1="472" x2="250" y2="472" stroke="rgba(217, 227, 178, 0.1)" strokeWidth="1" strokeDasharray="2 4" />
      </g>

      {/* Layer 2: Main Stem Anatomy (Trunk to First Spark) */}
      <path
        d="M 180 480 Q 176 320 180 80"
        fill="none"
        stroke="#272D24"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Parallel Vascular Vein Detail */}
      <path
        d="M 178 480 Q 174 320 178 80"
        fill="none"
        stroke="rgba(233, 138, 75, 0.2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Primary Vascular Stem */}
      <path
        className="root-path"
        d="M 180 480 L 180 80"
        fill="none"
        stroke={getPathColor('unlocked', originState)}
        strokeWidth={getPathWidth(originState)}
        strokeLinecap="round"
        filter={originState !== 'locked' ? 'url(#craftGlow)' : undefined}
      />

      {/* Node 1 Growth Rings (First Spark at 180, 80) */}
      <circle cx="180" cy="80" r="16" stroke="rgba(217, 227, 178, 0.25)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <circle cx="180" cy="80" r="24" stroke="rgba(217, 227, 178, 0.12)" strokeWidth="1" fill="none" />

      {/* First Spark Craftsman Diamond Motif */}
      {originState !== 'locked' && (
        <g opacity="0.9">
          <rect x="175" y="75" width="10" height="10" transform="rotate(45 180 80)" fill="#D9E3B2" stroke="#E98A4B" strokeWidth="0.8" />
        </g>
      )}

      {/* Layer 3A: Builder Secondary Limb (Left Branch) */}
      <path
        d="M 180 80 C 180 140 98 150 98 220"
        fill="none"
        stroke="#272D24"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Builder Architectural Keystone Accent */}
      {builderState !== 'locked' && (
        <path d="M 130 150 L 122 144 L 126 158 L 134 156 Z" fill="#D9E3B2" opacity="0.85" />
      )}

      {/* Layer 3B: Artisan Secondary Limb (Right Branch) */}
      <path
        d="M 180 80 C 180 140 262 150 262 220"
        fill="none"
        stroke="#272D24"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Artisan Hammer/Chisel Leaf Accent */}
      {artisanState !== 'locked' && (
        <path d="M 230 150 C 242 142 248 152 238 158 Z" fill="#E98A4B" opacity="0.85" />
      )}

      {/* Layer 4A: Builder Crest Axis (100, 220 -> 100, 370) */}
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

      {/* Layer 4B: Artisan Crest Axis (260, 220 -> 260, 370) */}
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

      {/* Authored Terminal Crest Emblem A: Builder's Keystone at (100, 370) */}
      <g transform="translate(100, 370)" opacity={builderCrestState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={builderCrestState !== 'locked' ? '#D9E3B2' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <path
          d="M -10 -12 L 10 -12 L 6 12 L -6 12 Z"
          fill={builderCrestState !== 'locked' ? '#D9E3B2' : '#2A322A'}
          stroke="#E98A4B"
          strokeWidth="1.5"
        />
        <rect x="-4" y="-4" width="8" height="8" fill="#141713" opacity="0.6" />
      </g>

      {/* Authored Terminal Crest Emblem B: Artisan's Anvil at (260, 370) */}
      <g transform="translate(260, 370)" opacity={artisanCrestState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={artisanCrestState !== 'locked' ? '#E98A4B' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <path
          d="M -12 -8 L 8 -8 L 12 -4 L 4 -2 L 4 4 L 8 10 L -8 10 L -4 4 L -4 -2 L -12 -4 Z"
          fill={artisanCrestState !== 'locked' ? '#D9E3B2' : '#2A322A'}
          stroke="#E98A4B"
          strokeWidth="1.5"
        />
      </g>

      {/* Layer 5: External Specimen Leader Lines & Botanical Margin Callouts */}
      <g className="botanical-leader-annotations">
        {/* Callout 1: First Spark (180, 80) -> Top Right Margin */}
        <polyline points="180,80 230,55 330,55" fill="none" stroke="rgba(217, 227, 178, 0.4)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="180" cy="80" r="2.5" fill="#D9E3B2" />
        <circle cx="330" cy="55" r="1.5" fill="#D9E3B2" />
        <text x="328" y="48" fill="#D9E3B2" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          FIG 4.1 · FIRST SPARK
        </text>

        {/* Callout 2: Builder Spec (100, 220) -> Left Margin */}
        <polyline points="100,220 60,200 25,200" fill="none" stroke="rgba(217, 227, 178, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="220" r="2.5" fill={builderState !== 'locked' ? '#D9E3B2' : '#3B463B'} />
        <text x="25" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" letterSpacing="0.05em">
          SPEC. A · BUILDER
        </text>

        {/* Callout 3: Artisan Spec (260, 220) -> Right Margin */}
        <polyline points="260,220 300,200 335,200" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="220" r="2.5" fill={artisanState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        <text x="335" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">
          SPEC. B · ARTISAN
        </text>

        {/* Callout 4: Builder Keystone Crest (100, 370) -> Left Bottom Margin */}
        <polyline points="100,370 50,390 25,390" fill="none" stroke="rgba(217, 227, 178, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="370" r="2.5" fill={builderCrestState !== 'locked' ? '#D9E3B2' : '#3B463B'} />
        <text x="25" y="383" fill="#D9E3B2" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic">
          CREST · BUILDER'S KEYSTONE
        </text>

        {/* Callout 5: Artisan Anvil Crest (260, 370) -> Right Bottom Margin */}
        <polyline points="260,370 310,390 335,390" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="370" r="2.5" fill={artisanCrestState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        <text x="335" y="383" fill="#D9E3B2" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          CREST · ARTISAN'S ANVIL
        </text>
      </g>
    </svg>
  );
};
