import React from 'react';
import { NodeState, Specialization } from '../types';

export interface WillBranchSvgProps {
  originState: NodeState;
  focusState: NodeState;
  courageState: NodeState;
  focusCrestState: NodeState;
  courageCrestState: NodeState;
  selectedSpecialization: Specialization | null;
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
      return '#FFD38A';
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
        <filter id="emberGlowWill" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Layer 0: Botanical Plate Grid & Elevation Scale Margin */}
      <g className="botanical-plate-background" opacity="0.45">
        {/* Horizontal Threshold Watermarks */}
        <line x1="20" y1="80" x2="340" y2="80" stroke="rgba(255, 211, 138, 0.15)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="220" x2="340" y2="220" stroke="rgba(255, 211, 138, 0.15)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="370" x2="340" y2="370" stroke="rgba(255, 211, 138, 0.15)" strokeDasharray="2 4" strokeWidth="1" />

        {/* Left Elevation Scale */}
        <line x1="24" y1="60" x2="24" y2="440" stroke="rgba(255, 211, 138, 0.25)" strokeWidth="1" />
        <line x1="20" y1="80" x2="28" y2="80" stroke="#FFD38A" strokeWidth="1.5" />
        <line x1="20" y1="220" x2="28" y2="220" stroke="#FFD38A" strokeWidth="1.5" />
        <line x1="20" y1="370" x2="28" y2="370" stroke="#FFD38A" strokeWidth="1.5" />

        <text x="14" y="83" fill="#FFD38A" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">1 XP</text>
        <text x="14" y="223" fill="#FFD38A" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">80 XP</text>
        <text x="14" y="373" fill="#FFD38A" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">160 XP</text>

        {/* Botanical Specimen Plate Header Marker */}
        <text x="180" y="24" fill="#FFD38A" fontSize="8" fontFamily="Fraunces" fontStyle="italic" textAnchor="middle" letterSpacing="0.1em">
          SPECIMEN NO. III · RAMUS VOLUNTAS (WILL)
        </text>
      </g>

      {/* Layer 1: Base Soil Substrate & Fibrous Rootlets */}
      <g className="root-fibrous-base">
        <path d="M 180 480 Q 150 435 105 445" stroke="rgba(255, 211, 138, 0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 210 435 255 445" stroke="rgba(255, 211, 138, 0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 170 420 140 410" stroke="rgba(255, 211, 138, 0.2)" strokeWidth="1" fill="none" />
        <path d="M 180 480 Q 190 420 220 410" stroke="rgba(255, 211, 138, 0.2)" strokeWidth="1" fill="none" />

        {/* Soil Substrate Hatching */}
        <line x1="125" y1="465" x2="235" y2="465" stroke="rgba(255, 211, 138, 0.15)" strokeWidth="1" strokeDasharray="3 6" />
        <line x1="105" y1="472" x2="255" y2="472" stroke="rgba(255, 211, 138, 0.1)" strokeWidth="1" strokeDasharray="2 4" />
      </g>

      {/* Layer 2: Main Stem Anatomy (Trunk to Iron Intent) */}
      <path
        d="M 180 480 Q 176 320 180 80"
        fill="none"
        stroke="#332B1B"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Parallel Vascular Vein Detail */}
      <path
        d="M 178 480 Q 174 320 178 80"
        fill="none"
        stroke="rgba(233, 138, 75, 0.25)"
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
        filter={originState !== 'locked' ? 'url(#willGlow)' : undefined}
      />

      {/* Node 1 Growth Rings (Iron Intent at 180, 80) */}
      <circle cx="180" cy="80" r="16" stroke="rgba(255, 211, 138, 0.3)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <circle cx="180" cy="80" r="24" stroke="rgba(255, 211, 138, 0.15)" strokeWidth="1" fill="none" />

      {/* Iron Intent Radiant Prism Sprout */}
      {originState !== 'locked' && (
        <g opacity="0.95">
          <polygon points="180,68 186,80 180,92 174,80" fill="#FFD38A" stroke="#E98A4B" strokeWidth="0.8" />
          <line x1="180" y1="64" x2="180" y2="96" stroke="#E98A4B" strokeWidth="0.5" />
        </g>
      )}

      {/* Layer 3A: Focus Secondary Limb (Left Branch) */}
      <path
        d="M 180 80 C 180 140 98 150 98 220"
        fill="none"
        stroke="#332B1B"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Focus Prism Tendril Accent */}
      {focusState !== 'locked' && (
        <polygon points="120,152 126,146 130,156 124,162" fill="#FFD38A" opacity="0.85" />
      )}

      {/* Layer 3B: Courage Secondary Limb (Right Branch) */}
      <path
        d="M 180 80 C 180 140 262 150 262 220"
        fill="none"
        stroke="#332B1B"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Courage Radiant Flame Accent */}
      {courageState !== 'locked' && (
        <path d="M 230 150 C 242 142 248 152 238 158 Z" fill="#E98A4B" opacity="0.85" />
      )}

      {/* Layer 4A: Focus Crest Axis (100, 220 -> 100, 370) */}
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

      {/* Layer 4B: Courage Crest Axis (260, 220 -> 260, 370) */}
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

      {/* Authored Terminal Crest Emblem A: Focus Prism at (100, 370) */}
      <g transform="translate(100, 370)" opacity={focusCrestState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={focusCrestState !== 'locked' ? '#FFD38A' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <polygon
          points="0,-12 10,0 0,12 -10,0"
          fill={focusCrestState !== 'locked' ? '#FFD38A' : '#2A322A'}
          stroke="#E98A4B"
          strokeWidth="1.5"
        />
        <line x1="0" y1="-12" x2="0" y2="12" stroke="#141713" strokeWidth="1" />
      </g>

      {/* Authored Terminal Crest Emblem B: Courage Shield at (260, 370) */}
      <g transform="translate(260, 370)" opacity={courageCrestState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={courageCrestState !== 'locked' ? '#E98A4B' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <path
          d="M -10 -10 L 0 -14 L 10 -10 L 10 2 C 10 9 0 14 0 14 C 0 14 -10 9 -10 2 Z"
          fill={courageCrestState !== 'locked' ? '#FFD38A' : '#2A322A'}
          stroke="#E98A4B"
          strokeWidth="1.5"
        />
        <path d="M 0 -8 L 0 8 M -6 0 L 6 0" stroke="#141713" strokeWidth="1.5" />
      </g>

      {/* Layer 5: External Specimen Leader Lines & Botanical Margin Callouts */}
      <g className="botanical-leader-annotations">
        {/* Callout 1: Iron Intent (180, 80) -> Top Right Margin */}
        <polyline points="180,80 230,55 330,55" fill="none" stroke="rgba(255, 211, 138, 0.4)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="180" cy="80" r="2.5" fill="#FFD38A" />
        <circle cx="330" cy="55" r="1.5" fill="#FFD38A" />
        <text x="328" y="48" fill="#FFD38A" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          FIG 3.1 · IRON INTENT
        </text>

        {/* Callout 2: Focus Spec (100, 220) -> Left Margin */}
        <polyline points="100,220 60,200 25,200" fill="none" stroke="rgba(255, 211, 138, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="220" r="2.5" fill={focusState !== 'locked' ? '#FFD38A' : '#3B463B'} />
        <text x="25" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" letterSpacing="0.05em">
          SPEC. A · FOCUS
        </text>

        {/* Callout 3: Courage Spec (260, 220) -> Right Margin */}
        <polyline points="260,220 300,200 335,200" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="220" r="2.5" fill={courageState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        <text x="335" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">
          SPEC. B · COURAGE
        </text>

        {/* Callout 4: Focus Prism Crest (100, 370) -> Left Bottom Margin */}
        <polyline points="100,370 50,390 25,390" fill="none" stroke="rgba(255, 211, 138, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="370" r="2.5" fill={focusCrestState !== 'locked' ? '#FFD38A' : '#3B463B'} />
        <text x="25" y="383" fill="#FFD38A" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic">
          CREST · FOCUS PRISM
        </text>

        {/* Callout 5: Courage Shield Crest (260, 370) -> Right Bottom Margin */}
        <polyline points="260,370 310,390 335,390" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="370" r="2.5" fill={courageCrestState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        <text x="335" y="383" fill="#FFD38A" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          CREST · COURAGE SHIELD
        </text>
      </g>
    </svg>
  );
};
