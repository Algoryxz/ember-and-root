import React from 'react';
import { NodeState, Specialization } from '../types';

export interface BodyBranchSvgProps {
  originState: NodeState;
  enduranceState: NodeState;
  mobilityState: NodeState;
  enduranceCrestState: NodeState;
  mobilityCrestState: NodeState;
  selectedSpecialization: Specialization | null;
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
      return '#E98A4B';
    }
    if (toState === 'available') {
      return '#FFD38A';
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
        <filter id="emberGlowBody" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Layer 0: Botanical Plate Grid & Elevation Scale Margin */}
      <g className="botanical-plate-background" opacity="0.45">
        {/* Horizontal Threshold Watermarks */}
        <line x1="20" y1="80" x2="340" y2="80" stroke="rgba(233, 138, 75, 0.15)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="220" x2="340" y2="220" stroke="rgba(233, 138, 75, 0.15)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="370" x2="340" y2="370" stroke="rgba(233, 138, 75, 0.15)" strokeDasharray="2 4" strokeWidth="1" />

        {/* Left Elevation Scale */}
        <line x1="24" y1="60" x2="24" y2="440" stroke="rgba(233, 138, 75, 0.25)" strokeWidth="1" />
        <line x1="20" y1="80" x2="28" y2="80" stroke="#E98A4B" strokeWidth="1.5" />
        <line x1="20" y1="220" x2="28" y2="220" stroke="#E98A4B" strokeWidth="1.5" />
        <line x1="20" y1="370" x2="28" y2="370" stroke="#E98A4B" strokeWidth="1.5" />

        <text x="14" y="83" fill="#E98A4B" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">1 XP</text>
        <text x="14" y="223" fill="#E98A4B" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">80 XP</text>
        <text x="14" y="373" fill="#E98A4B" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">160 XP</text>

        {/* Botanical Specimen Plate Header Marker */}
        <text x="180" y="24" fill="#E98A4B" fontSize="8" fontFamily="Fraunces" fontStyle="italic" textAnchor="middle" letterSpacing="0.1em">
          SPECIMEN NO. II · RAMUS CORPUS (BODY)
        </text>
      </g>

      {/* Layer 1: Base Soil Substrate & Fibrous Rootlets */}
      <g className="root-fibrous-base">
        <path d="M 180 480 Q 145 435 100 445" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 215 435 260 445" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 165 420 135 410" stroke="rgba(233, 138, 75, 0.2)" strokeWidth="1" fill="none" />
        <path d="M 180 480 Q 195 420 225 410" stroke="rgba(233, 138, 75, 0.2)" strokeWidth="1" fill="none" />

        {/* Soil Substrate Hatching */}
        <line x1="120" y1="465" x2="240" y2="465" stroke="rgba(233, 138, 75, 0.15)" strokeWidth="1" strokeDasharray="3 6" />
        <line x1="100" y1="472" x2="260" y2="472" stroke="rgba(233, 138, 75, 0.1)" strokeWidth="1" strokeDasharray="2 4" />
      </g>

      {/* Layer 2: Main Stem Anatomy (Trunk to Rooted Stance) */}
      <path
        d="M 180 480 Q 175 320 180 80"
        fill="none"
        stroke="#2B2319"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Parallel Vascular Vein Detail */}
      <path
        d="M 178 480 Q 173 320 178 80"
        fill="none"
        stroke="rgba(255, 211, 138, 0.2)"
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
        filter={originState !== 'locked' ? 'url(#bodyGlow)' : undefined}
      />

      {/* Node 1 Growth Rings (Rooted Stance at 180, 80) */}
      <circle cx="180" cy="80" r="16" stroke="rgba(233, 138, 75, 0.3)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <circle cx="180" cy="80" r="24" stroke="rgba(233, 138, 75, 0.15)" strokeWidth="1" fill="none" />

      {/* Rooted Stance Muscular Tendril Motif */}
      {originState !== 'locked' && (
        <g opacity="0.9">
          <path d="M 180 80 C 160 72 152 80 162 86 C 172 88 178 82 180 80 Z" fill="#E98A4B" stroke="#FFD38A" strokeWidth="0.5" />
          <path d="M 180 80 C 200 72 208 80 198 86 C 188 88 182 82 180 80 Z" fill="#E98A4B" stroke="#FFD38A" strokeWidth="0.5" />
        </g>
      )}

      {/* Layer 3A: Endurance Secondary Limb (Left Branch) */}
      <path
        d="M 180 80 C 180 140 98 150 98 220"
        fill="none"
        stroke="#2B2319"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Endurance Thick Bark Detail */}
      {enduranceState !== 'locked' && (
        <path d="M 130 150 C 115 142 110 152 120 158 Z" fill="#E98A4B" opacity="0.85" />
      )}

      {/* Layer 3B: Mobility Secondary Limb (Right Branch) */}
      <path
        d="M 180 80 C 180 140 262 150 262 220"
        fill="none"
        stroke="#2B2319"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Mobility Flexing Tendril Detail */}
      {mobilityState !== 'locked' && (
        <path d="M 230 150 C 245 142 250 152 240 158 Z" fill="#FFD38A" opacity="0.85" />
      )}

      {/* Layer 4A: Endurance Crest Axis (100, 220 -> 100, 370) */}
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

      {/* Layer 4B: Mobility Crest Axis (260, 220 -> 260, 370) */}
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

      {/* Authored Terminal Crest Emblem A: Endurance Aegis at (100, 370) */}
      <g transform="translate(100, 370)" opacity={enduranceCrestState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={enduranceCrestState !== 'locked' ? '#E98A4B' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <path
          d="M -10 -10 L 10 -10 L 10 0 C 10 8 0 14 0 14 C 0 14 -10 8 -10 0 Z"
          fill={enduranceCrestState !== 'locked' ? '#E98A4B' : '#2A322A'}
          stroke="#FFD38A"
          strokeWidth="1.5"
        />
        <circle cx="0" cy="0" r="3" fill="#FFD38A" />
      </g>

      {/* Authored Terminal Crest Emblem B: Mobility Wing at (260, 370) */}
      <g transform="translate(260, 370)" opacity={mobilityCrestState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={mobilityCrestState !== 'locked' ? '#FFD38A' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <path
          d="M -12 6 C -6 -6 4 -12 12 -12 C 4 -4 -2 2 -12 6 Z"
          fill={mobilityCrestState !== 'locked' ? '#E98A4B' : '#2A322A'}
          stroke="#FFD38A"
          strokeWidth="1.5"
        />
        <path
          d="M -8 10 C -2 0 6 -6 14 -6 C 6 0 2 6 -8 10 Z"
          fill={mobilityCrestState !== 'locked' ? '#FFD38A' : '#2A322A'}
          opacity="0.8"
        />
      </g>

      {/* Layer 5: External Specimen Leader Lines & Botanical Margin Callouts */}
      <g className="botanical-leader-annotations">
        {/* Callout 1: Rooted Stance (180, 80) -> Top Right Margin */}
        <polyline points="180,80 230,55 330,55" fill="none" stroke="rgba(233, 138, 75, 0.4)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="180" cy="80" r="2.5" fill="#E98A4B" />
        <circle cx="330" cy="55" r="1.5" fill="#E98A4B" />
        <text x="328" y="48" fill="#FFD38A" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          FIG 2.1 · ROOTED STANCE
        </text>

        {/* Callout 2: Endurance Spec (100, 220) -> Left Margin */}
        <polyline points="100,220 60,200 25,200" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="220" r="2.5" fill={enduranceState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        <text x="25" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" letterSpacing="0.05em">
          SPEC. A · ENDURANCE
        </text>

        {/* Callout 3: Mobility Spec (260, 220) -> Right Margin */}
        <polyline points="260,220 300,200 335,200" fill="none" stroke="rgba(255, 211, 138, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="220" r="2.5" fill={mobilityState !== 'locked' ? '#FFD38A' : '#3B463B'} />
        <text x="335" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">
          SPEC. B · MOBILITY
        </text>

        {/* Callout 4: Endurance Aegis Crest (100, 370) -> Left Bottom Margin */}
        <polyline points="100,370 50,390 25,390" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="370" r="2.5" fill={enduranceCrestState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        <text x="25" y="383" fill="#FFD38A" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic">
          CREST · ENDURANCE AEGIS
        </text>

        {/* Callout 5: Mobility Wing Crest (260, 370) -> Right Bottom Margin */}
        <polyline points="260,370 310,390 335,390" fill="none" stroke="rgba(255, 211, 138, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="370" r="2.5" fill={mobilityCrestState !== 'locked' ? '#FFD38A' : '#3B463B'} />
        <text x="335" y="383" fill="#FFD38A" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          CREST · MOBILITY WING
        </text>
      </g>
    </svg>
  );
};
