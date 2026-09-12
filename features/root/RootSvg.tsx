import React, { useState } from 'react';
import { AttributeId, BranchState, GameSnapshot, Specialization } from '../../game/contracts';
import { RootTreeState } from './types';
import { RootTabs } from './RootTabs';
import { RootBranch } from './RootBranch';
import { INITIAL_TREE_STATE } from './fixtures';

export interface RootSvgProps {
  snapshot?: GameSnapshot;
  treeState?: RootTreeState;
  mindState?: BranchState;
  selectedAttribute?: AttributeId;
  isPending?: boolean;
  error?: string | null;
  onSelectSpecialization?: (attribute: AttributeId, spec: Specialization) => void;
  onStartTrial?: (attribute: AttributeId, spec: Specialization) => void;
  onProgressSession?: (attribute: AttributeId) => void;
  onRecordMilestone?: (attribute: AttributeId, text: string) => void;
  onClaimCrest?: (attribute: AttributeId) => void;
  className?: string;
}

export const RootSvg: React.FC<RootSvgProps> = ({
  snapshot,
  treeState,
  mindState,
  selectedAttribute: initialAttribute = 'mind',
  isPending = false,
  error = null,
  onSelectSpecialization,
  onStartTrial,
  onProgressSession,
  onRecordMilestone,
  onClaimCrest,
  className = '',
}: RootSvgProps) => {
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeId>(initialAttribute);

  // Reconcile snapshot or treeState props
  const activeTreeState: RootTreeState = snapshot
    ? { branches: snapshot.branches }
    : treeState || {
        branches: {
          mind: mindState || INITIAL_TREE_STATE.branches.mind,
          body: INITIAL_TREE_STATE.branches.body,
          will: INITIAL_TREE_STATE.branches.will,
          craft: INITIAL_TREE_STATE.branches.craft,
        },
      };

  const trials = snapshot?.trials || {};
  const currentBranchState: BranchState =
    activeTreeState.branches[selectedAttribute] || INITIAL_TREE_STATE.branches[selectedAttribute];

  const currentTrial = trials[selectedAttribute] || null;

  return (
    <div className={`root-svg-container ${className}`}>
      {/* Attribute Tab Bar */}
      <RootTabs
        selectedAttribute={selectedAttribute}
        onSelectAttribute={setSelectedAttribute}
      />

      {/* Render Current Attribute Branch & Active Trial */}
      <RootBranch
        attribute={selectedAttribute}
        state={currentBranchState}
        trial={currentTrial}
        isPending={isPending}
        error={error}
        onSelectSpecialization={onSelectSpecialization}
        onStartTrial={onStartTrial}
        onProgressSession={onProgressSession}
        onRecordMilestone={onRecordMilestone}
        onClaimCrest={onClaimCrest}
      />
    </div>
  );
};
