'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import './ScrollRootSpine.css';

interface ScrollRootSpineProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const ScrollRootSpine: React.FC<ScrollRootSpineProps> = ({ containerRef }) => {
  const spineRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef || spineRef,
    offset: ['start 80%', 'end 90%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  // Derived transforms for progressive branch and nodal illumination
  const node1Opacity = useTransform(smoothProgress, [0.12, 0.22], [0.3, 1]);
  const node2Opacity = useTransform(smoothProgress, [0.28, 0.38], [0.3, 1]);
  const node3Opacity = useTransform(smoothProgress, [0.45, 0.55], [0.3, 1]);
  const node4Opacity = useTransform(smoothProgress, [0.62, 0.72], [0.3, 1]);
  const node5Opacity = useTransform(smoothProgress, [0.78, 0.88], [0.3, 1]);
  const node6Opacity = useTransform(smoothProgress, [0.90, 1.00], [0.3, 1]);

  return (
    <div className="scroll-root-spine-container" ref={spineRef} aria-hidden="true">
      <svg
        viewBox="0 0 160 2400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="scroll-root-spine-svg"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <linearGradient id="rootSpineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B9BEAC" stopOpacity="0.4" />
            <stop offset="25%" stopColor="#E98A4B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFD38A" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#9FBA87" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C4A96A" stopOpacity="1" />
          </linearGradient>

          <filter id="spineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Track (faint ghostly dormant filament guide) */}
        <path
          d="M80 0 C80 180, 50 280, 75 420 C100 560, 60 700, 85 840 C110 980, 65 1120, 80 1260 C95 1400, 55 1540, 80 1680 C105 1820, 70 1960, 80 2100 L80 2400"
          stroke="#1F261F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Active Animated Primary Filament (grows physically with scroll) */}
        <motion.path
          d="M80 0 C80 180, 50 280, 75 420 C100 560, 60 700, 85 840 C110 980, 65 1120, 80 1260 C95 1400, 55 1540, 80 1680 C105 1820, 70 1960, 80 2100 L80 2400"
          stroke="url(#rootSpineGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          style={{ pathLength: smoothProgress }}
          filter="url(#spineGlow)"
        />

        {/* Stage 1 Node: Inscribe (Y ~ 420) */}
        <motion.g style={{ opacity: node1Opacity }}>
          <circle cx="75" cy="420" r="5" fill="#141713" stroke="#C4A96A" strokeWidth="2" />
          <circle cx="75" cy="420" r="2.5" fill="#FFD38A" />
          {/* Subtle lateral tendril shoot */}
          <path d="M75 420 C60 415, 45 425, 38 435" stroke="#9FBA87" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </motion.g>

        {/* Stage 2 Node: Act (Y ~ 840) */}
        <motion.g style={{ opacity: node2Opacity }}>
          <circle cx="85" cy="840" r="6" fill="#141713" stroke="#B9BEAC" strokeWidth="2" />
          <circle cx="85" cy="840" r="2.5" fill="#E98A4B" />
          <path d="M85 840 C105 830, 120 845, 130 855" stroke="#E98A4B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </motion.g>

        {/* Stage 3 Node: Seal (Y ~ 1260) */}
        <motion.g style={{ opacity: node3Opacity }}>
          <circle cx="80" cy="1260" r="8" fill="#1D231D" stroke="#E98A4B" strokeWidth="2.5" />
          <circle cx="80" cy="1260" r="4" fill="#FFD38A" />
          <path d="M80 1260 C60 1250, 40 1270, 32 1285" stroke="#FFD38A" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        </motion.g>

        {/* Stage 4 Node: Ember Energy Conduit (Y ~ 1680) */}
        <motion.g style={{ opacity: node4Opacity }}>
          <circle cx="80" cy="1680" r="9" fill="#241B18" stroke="#FFD38A" strokeWidth="2.5" />
          <circle cx="80" cy="1680" r="4.5" fill="#FFF2D6" />
          <path d="M80 1680 C105 1665, 128 1685, 140 1705" stroke="#E98A4B" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </motion.g>

        {/* Stage 5: Mature Branch Fork (Y ~ 2100 - Mind, Body, Will, Craft divergence) */}
        <motion.g style={{ opacity: node5Opacity }}>
          {/* Mind Branch (Left high) */}
          <path d="M80 2100 C60 2070, 35 2085, 20 2120" stroke="#7BA3C7" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="20" cy="2120" r="3.5" fill="#7BA3C7" />

          {/* Body Branch (Right high) */}
          <path d="M80 2100 C100 2070, 125 2085, 140 2120" stroke="#B87D67" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="140" cy="2120" r="3.5" fill="#B87D67" />

          {/* Will Branch (Left low) */}
          <path d="M80 2100 C65 2125, 45 2150, 35 2190" stroke="#C4A96A" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="35" cy="2190" r="3.5" fill="#C4A96A" />

          {/* Craft Branch (Right low) */}
          <path d="M80 2100 C95 2125, 115 2150, 125 2190" stroke="#8EA878" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="125" cy="2190" r="3.5" fill="#8EA878" />
        </motion.g>

        {/* Stage 6: Crest Silhouette Culmination (Y ~ 2360) */}
        <motion.g style={{ opacity: node6Opacity }}>
          <polygon
            points="80,2340 92,2365 80,2390 68,2365"
            fill="none"
            stroke="#C4A96A"
            strokeWidth="2"
          />
          <circle cx="80" cy="2365" r="3" fill="#FFD38A" />
        </motion.g>
      </svg>
    </div>
  );
};
