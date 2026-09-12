import React from 'react';
import { MindNodeInfo, SpecializationId } from './types';
import { RootList } from './RootList';

export interface MindRootListProps {
  nodes: MindNodeInfo[];
  mindXP: number;
  selectedSpecialization: SpecializationId | null;
  onSelectSpecialization?: (spec: SpecializationId) => void;
}

export const MindRootList: React.FC<MindRootListProps> = ({
  nodes,
  mindXP,
  selectedSpecialization,
  onSelectSpecialization,
}: MindRootListProps) => {
  return (
    <RootList
      attribute="mind"
      nodes={nodes}
      xp={mindXP}
      selectedSpecialization={selectedSpecialization}
      onSelectSpecialization={
        onSelectSpecialization
          ? (_attr, spec) => onSelectSpecialization(spec)
          : undefined
      }
    />
  );
};
