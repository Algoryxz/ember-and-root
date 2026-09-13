import React from 'react';
import { NodeState, Specialization } from '../types';

export interface MindBranchSvgProps {
  firstThoughtState: NodeState;
  scholarState: NodeState;
  explorerState: NodeState;
  scholarsCrownState: NodeState;
  explorersCompassState: NodeState;
  selectedSpecialization: Specialization | null;
  interactive?: boolean;
}

export const MindBranchSvg: React.FC<MindBranchSvgProps> = ({
  firstThoughtState,
  scholarState,
  explorerState,
  scholarsCrownState,
  explorersCompassState,
  selectedSpecialization,
  interactive = false,
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

      {/* Layer 0: Botanical Plate Grid & Elevation Scale Margin */}
      <g className="botanical-plate-background" opacity="0.45">
        {/* Horizontal Threshold Watermarks */}
        <line x1="20" y1="80" x2="340" y2="80" stroke="rgba(159, 186, 135, 0.12)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="220" x2="340" y2="220" stroke="rgba(159, 186, 135, 0.12)" strokeDasharray="2 4" strokeWidth="1" />
        <line x1="20" y1="370" x2="340" y2="370" stroke="rgba(159, 186, 135, 0.12)" strokeDasharray="2 4" strokeWidth="1" />

        {/* Left Elevation Scale */}
        <line x1="24" y1="60" x2="24" y2="440" stroke="rgba(159, 186, 135, 0.25)" strokeWidth="1" />
        <line x1="20" y1="80" x2="28" y2="80" stroke="#9FBA87" strokeWidth="1.5" />
        <line x1="20" y1="220" x2="28" y2="220" stroke="#9FBA87" strokeWidth="1.5" />
        <line x1="20" y1="370" x2="28" y2="370" stroke="#9FBA87" strokeWidth="1.5" />

        <text x="14" y="83" fill="#9FBA87" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">1 XP</text>
        <text x="14" y="223" fill="#9FBA87" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">80 XP</text>
        <text x="14" y="373" fill="#9FBA87" fontSize="7" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">160 XP</text>

        {/* Botanical Specimen Plate Header Marker */}
        <text x="180" y="24" fill="#9FBA87" fontSize="8" fontFamily="Fraunces" fontStyle="italic" textAnchor="middle" letterSpacing="0.1em">
          SPECIMEN NO. I · RAMUS INTELLECTUS (MIND)
        </text>
      </g>

      {/* Layer 1: Base Soil Substrate & Fibrous Rootlets */}
      <g className="root-fibrous-base">
        <path d="M 180 480 Q 150 435 110 445" stroke="rgba(159, 186, 135, 0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 210 435 250 445" stroke="rgba(159, 186, 135, 0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 180 480 Q 170 420 140 410" stroke="rgba(159, 186, 135, 0.2)" strokeWidth="1" fill="none" />
        <path d="M 180 480 Q 190 420 220 410" stroke="rgba(159, 186, 135, 0.2)" strokeWidth="1" fill="none" />

        {/* Soil Substrate Hatching */}
        <line x1="130" y1="465" x2="230" y2="465" stroke="rgba(159, 186, 135, 0.15)" strokeWidth="1" strokeDasharray="3 6" />
        <line x1="110" y1="472" x2="250" y2="472" stroke="rgba(159, 186, 135, 0.1)" strokeWidth="1" strokeDasharray="2 4" />
      </g>

      {/* Layer 2: Main Stem Anatomy (Trunk to First Thought) */}
      <path
        d="M 180 480 Q 176 320 180 80"
        fill="none"
        stroke="#1D2A1C"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Parallel Vascular Vein Detail */}
      <path
        d="M 178 480 Q 174 320 178 80"
        fill="none"
        stroke="rgba(217, 227, 178, 0.2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Primary Vascular Stem */}
      <path
        className="root-path"
        d="M 180 480 L 180 80"
        fill="none"
        stroke={getPathColor('unlocked', firstThoughtState)}
        strokeWidth={getPathWidth(firstThoughtState)}
        strokeLinecap="round"
        filter={firstThoughtState !== 'locked' ? 'url(#rootGlow)' : undefined}
      />

      {/* Node 1 Growth Rings (First Thought at 180, 80) */}
      <circle cx="180" cy="80" r="16" stroke="rgba(159, 186, 135, 0.25)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <circle cx="180" cy="80" r="24" stroke="rgba(159, 186, 135, 0.12)" strokeWidth="1" fill="none" />

      {/* First Thought Leaf Pair Sprout */}
      {firstThoughtState !== 'locked' && (
        <g opacity="0.9">
          <path d="M 180 80 C 160 70 150 78 158 84 C 168 88 178 82 180 80 Z" fill="#9FBA87" stroke="#D9E3B2" strokeWidth="0.5" />
          <path d="M 180 80 C 200 70 210 78 202 84 C 192 88 182 82 180 80 Z" fill="#9FBA87" stroke="#D9E3B2" strokeWidth="0.5" />
        </g>
      )}

      {/* Layer 3A: Scholar Secondary Limb (Left Branch) */}
      <path
        d="M 180 80 C 180 140 98 150 98 220"
        fill="none"
        stroke="#1D2A1C"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Scholar Leaf Node Detail */}
      {scholarState !== 'locked' && (
        <path d="M 130 150 C 115 142 110 152 120 158 Z" fill="#9FBA87" opacity="0.8" />
      )}

      {/* Layer 3B: Explorer Secondary Limb (Right Branch) */}
      <path
        d="M 180 80 C 180 140 262 150 262 220"
        fill="none"
        stroke="#1D2A1C"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
      {/* Explorer Compass Tendril Detail */}
      {explorerState !== 'locked' && (
        <path d="M 230 150 C 245 142 250 152 240 158 Z" fill="#E98A4B" opacity="0.8" />
      )}

      {/* Layer 4A: Scholar Crest Axis (100, 220 -> 100, 370) */}
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

      {/* Layer 4B: Explorer Crest Axis (260, 220 -> 260, 370) */}
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

      {/* Authored Terminal Crest Emblem A: Scholar's Crown at (100, 370) */}
      <g transform="translate(100, 370)" opacity={scholarsCrownState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={scholarsCrownState !== 'locked' ? '#9FBA87' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <path
          d="M -14 0 Q -7 -14 0 -6 Q 7 -14 14 0 L 10 10 L -10 10 Z"
          fill={scholarsCrownState !== 'locked' ? '#9FBA87' : '#2A322A'}
          stroke="#D9E3B2"
          strokeWidth="1.5"
        />
        <circle cx="0" cy="-8" r="2.5" fill="#FFD38A" />
      </g>

      {/* Authored Terminal Crest Emblem B: Explorer's Compass at (260, 370) */}
      <g transform="translate(260, 370)" opacity={explorersCompassState !== 'locked' ? 1 : 0.45}>
        <circle cx="0" cy="0" r="22" stroke={explorersCompassState !== 'locked' ? '#E98A4B' : '#3B463B'} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        <circle cx="0" cy="0" r="12" fill="none" stroke="#9FBA87" strokeWidth="1.5" />
        <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="#E98A4B" />
        <path d="M -10 0 L 0 3 L 10 0 L 0 -3 Z" fill="#D9E3B2" />
      </g>

      {/* Layer 5: External Specimen Leader Lines & Botanical Margin Callouts */}
      <g className="botanical-leader-annotations">
        {/* Callout 1: First Thought (180, 80) -> Top Right Margin */}
        <polyline points="180,80 230,55 330,55" fill="none" stroke="rgba(159, 186, 135, 0.4)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="180" cy="80" r="2.5" fill="#9FBA87" />
        <circle cx="330" cy="55" r="1.5" fill="#9FBA87" />
        {!interactive && (
        <text x="328" y="48" fill="#D9E3B2" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          FIG 1.1 · PRIMORIAL SEED
        </text>
      )}

        {/* Callout 2: Scholar Spec (100, 220) -> Left Margin */}
        <polyline points="100,220 60,200 25,200" fill="none" stroke="rgba(159, 186, 135, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="220" r="2.5" fill={scholarState !== 'locked' ? '#9FBA87' : '#3B463B'} />
        {!interactive && (
        <text x="25" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" letterSpacing="0.05em">
          SPEC. A · SCHOLAR
        </text>
      )}

        {/* Callout 3: Explorer Spec (260, 220) -> Right Margin */}
        <polyline points="260,220 300,200 335,200" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="220" r="2.5" fill={explorerState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        {!interactive && (
        <text x="335" y="193" fill="#B9BEAC" fontSize="7.5" fontFamily="DM Sans" textAnchor="end" letterSpacing="0.05em">
          SPEC. B · EXPLORER
        </text>
      )}

        {/* Callout 4: Scholar Crown Crest (100, 370) -> Left Bottom Margin */}
        <polyline points="100,370 50,390 25,390" fill="none" stroke="rgba(159, 186, 135, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="100" cy="370" r="2.5" fill={scholarsCrownState !== 'locked' ? '#9FBA87' : '#3B463B'} />
        {!interactive && (
        <text x="25" y="383" fill="#D9E3B2" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic">
          CREST · SCHOLAR'S CROWN
        </text>
      )}

        {/* Callout 5: Explorer Compass Crest (260, 370) -> Right Bottom Margin */}
        <polyline points="260,370 310,390 335,390" fill="none" stroke="rgba(233, 138, 75, 0.35)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="260" cy="370" r="2.5" fill={explorersCompassState !== 'locked' ? '#E98A4B' : '#3B463B'} />
        {!interactive && (
        <text x="335" y="383" fill="#D9E3B2" fontSize="7.5" fontFamily="Fraunces" fontStyle="italic" textAnchor="end">
          CREST · EXPLORER'S COMPASS
        </text>
      )}
      </g>
    </svg>
  );
};
