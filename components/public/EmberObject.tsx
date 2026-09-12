'use client';

import React, { useState } from 'react';
import './EmberObject.css';

interface EmberObjectProps {
  size?: number;
  interactive?: boolean;
  onPulse?: () => void;
  className?: string;
  state?: 'resting' | 'kindled' | 'steady' | 'blazing';
}

export const EmberObject: React.FC<EmberObjectProps> = ({
  size = 180,
  interactive = true,
  onPulse,
  className = '',
  state = 'kindled',
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = () => {
    if (!interactive) return;
    setIsPulsing(true);
    if (onPulse) onPulse();
    setTimeout(() => setIsPulsing(false), 900);
  };

  return (
    <div
      className={`ember-object-container ember-state-${state} ${isPulsing ? 'is-pulsing' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={handleClick}
      role={interactive ? 'button' : 'img'}
      aria-label="Living Ember flame: What you do each day kindles this light"
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Directional Warm Halo */}
      <div className="ember-directional-halo" aria-hidden="true" />

      {/* SVG Layered Flame Geometry */}
      <svg
        viewBox="0 0 160 160"
        className="ember-svg-organism"
        aria-hidden="true"
      >
        <defs>
          {/* Radial Core Gradient */}
          <radialGradient id="emberCoreGrad" cx="50%" cy="65%" r="45%">
            <stop offset="0%" stopColor="#FFF4DE" stopOpacity="1" />
            <stop offset="35%" stopColor="#FFD38A" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#E98A4B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C46D32" stopOpacity="0" />
          </radialGradient>

          {/* Intermediate Flame Body Gradient */}
          <linearGradient id="emberBodyGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#B34C1E" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#E98A4B" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#FFD38A" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFF0D0" stopOpacity="0.9" />
          </linearGradient>

          {/* Outer Shroud Gradient */}
          <radialGradient id="emberShroudGrad" cx="50%" cy="75%" r="60%">
            <stop offset="0%" stopColor="#E98A4B" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#9E3B1B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#141713" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="emberGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Coal Bed / Hearth Well Base */}
        <ellipse
          cx="80"
          cy="132"
          rx="44"
          ry="14"
          className="ember-coal-bed"
        />
        <ellipse
          cx="80"
          cy="131"
          rx="32"
          ry="8"
          className="ember-coal-glow"
        />

        {/* 2. Outer Atmospheric Envelope */}
        <path
          d="M80 20 C68 46 42 74 42 108 C42 126 58 138 80 138 C102 138 118 126 118 108 C118 74 92 46 80 20 Z"
          className="ember-flame-envelope"
          fill="url(#emberShroudGrad)"
        />

        {/* 3. Intermediate Organic Flame Tendrils */}
        <path
          d="M80 32 C72 52 50 78 50 106 C50 124 64 135 80 135 C96 135 110 124 110 106 C110 82 92 56 80 32 Z"
          className="ember-flame-body"
          fill="url(#emberBodyGrad)"
          filter="url(#emberGlow)"
        />

        {/* 4. Left Licking Tongue */}
        <path
          d="M74 54 C66 70 58 88 62 108 C65 94 72 82 78 72 C80 66 77 58 74 54 Z"
          className="ember-flame-tongue tongue-left"
          fill="#FFD38A"
          opacity="0.75"
        />

        {/* 5. Right Licking Tongue */}
        <path
          d="M86 52 C94 68 100 86 96 104 C94 92 88 80 82 70 C80 64 83 56 86 52 Z"
          className="ember-flame-tongue tongue-right"
          fill="#FFD38A"
          opacity="0.75"
        />

        {/* 6. Incandescent Core Heart */}
        <path
          d="M80 68 C74 82 66 98 66 114 C66 126 72 133 80 133 C88 133 94 126 94 114 C94 98 86 82 80 68 Z"
          className="ember-flame-core"
          fill="url(#emberCoreGrad)"
        />

        {/* 7. Core White-Hot Node */}
        <circle
          cx="80"
          cy="114"
          r="7"
          className="ember-white-hot"
        />

        {/* 8. Micro Ember Motes (Ascending) */}
        <circle cx="76" cy="48" r="1.5" className="ember-mote mote-1" />
        <circle cx="85" cy="40" r="1.2" className="ember-mote mote-2" />
        <circle cx="72" cy="34" r="1.0" className="ember-mote mote-3" />
      </svg>
    </div>
  );
};
