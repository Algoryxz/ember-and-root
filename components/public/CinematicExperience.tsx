'use client';

import React from 'react';
import { OpeningSequence } from './opening/OpeningSequence';

export interface CinematicExperienceProps {
  onComplete?: () => void;
  className?: string;
}

/**
 * CinematicExperience wraps OpeningSequence as the authoritative single cinematic pipeline.
 * Preserves backwards compatibility for any route referring to CinematicExperience.
 */
export const CinematicExperience: React.FC<CinematicExperienceProps> = ({
  className = '',
}) => {
  return (
    <div className={`cinematic-unified-host ${className}`}>
      <OpeningSequence />
    </div>
  );
};
