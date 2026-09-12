import React from 'react';
import { MindBranchState, SpecializationId } from './types';
import { RootBranch } from './RootBranch';

export interface MindBranchProps {
  state: MindBranchState;
  onSelectSpecialization?: (spec: SpecializationId) => void;
  className?: string;
}

export const MindBranch: React.FC<MindBranchProps> = ({
  state,
  onSelectSpecialization,
  className = '',
}: MindBranchProps) => {
  return (
    <RootBranch
      attribute="mind"
      state={state}
      onSelectSpecialization={
        onSelectSpecialization
          ? (_attr, spec) => onSelectSpecialization(spec)
          : undefined
      }
      className={className}
    />
  );
};
