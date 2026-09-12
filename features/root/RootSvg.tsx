import React from 'react';
import { MindBranch } from './MindBranch';
import { MindBranchState, SpecializationId } from './types';

export interface RootSvgProps {
  mindState: MindBranchState;
  onSelectSpecialization?: (spec: SpecializationId) => void;
  className?: string;
}

export const RootSvg: React.FC<RootSvgProps> = ({
  mindState,
  onSelectSpecialization,
  className = '',
}: RootSvgProps) => {
  return (
    <div className={`root-svg-container ${className}`}>
      <MindBranch
        state={mindState}
        onSelectSpecialization={onSelectSpecialization}
      />
    </div>
  );
};
