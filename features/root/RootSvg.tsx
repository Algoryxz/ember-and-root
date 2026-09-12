import React, { useState } from 'react';
import { AttributeId, BranchState, MindBranchState, RootTreeState, SpecializationId } from './types';
import { RootTabs } from './RootTabs';
import { RootBranch } from './RootBranch';
import { INITIAL_TREE_STATE } from './fixtures';

export interface RootSvgProps {
  treeState?: RootTreeState;
  mindState?: MindBranchState;
  selectedAttribute?: AttributeId;
  onSelectSpecialization?: (attribute: AttributeId, spec: SpecializationId) => void;
  className?: string;
}

export const RootSvg: React.FC<RootSvgProps> = ({
  treeState,
  mindState,
  selectedAttribute: initialAttribute = 'mind',
  onSelectSpecialization,
  className = '',
}: RootSvgProps) => {
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeId>(initialAttribute);

  // Reconcile props: if treeState is provided use it, otherwise fall back to mindState or initial state
  const activeTreeState: RootTreeState = treeState || {
    branches: {
      mind: mindState || INITIAL_TREE_STATE.branches.mind,
      body: INITIAL_TREE_STATE.branches.body,
      will: INITIAL_TREE_STATE.branches.will,
      craft: INITIAL_TREE_STATE.branches.craft,
    },
  };

  const currentBranchState: BranchState =
    activeTreeState.branches[selectedAttribute] || INITIAL_TREE_STATE.branches[selectedAttribute];

  return (
    <div className={`root-svg-container ${className}`}>
      {/* Attribute Tab Bar */}
      <RootTabs
        selectedAttribute={selectedAttribute}
        onSelectAttribute={setSelectedAttribute}
      />

      {/* Render Current Attribute Branch */}
      <RootBranch
        attribute={selectedAttribute}
        state={currentBranchState}
        onSelectSpecialization={onSelectSpecialization}
      />
    </div>
  );
};
