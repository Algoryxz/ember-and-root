import React from 'react';
import { AttributeId, NodeState, RootNodeInfo, SpecializationId } from '../types';
import { MindBranchSvg } from './MindBranchSvg';
import { BodyBranchSvg } from './BodyBranchSvg';
import { WillBranchSvg } from './WillBranchSvg';
import { CraftBranchSvg } from './CraftBranchSvg';

export interface BranchSvgRendererProps {
  attribute: AttributeId;
  nodes: RootNodeInfo[];
  selectedSpecialization: SpecializationId | null;
  interactive?: boolean;
}

export const BranchSvgRenderer: React.FC<BranchSvgRendererProps> = ({
  attribute,
  nodes,
  selectedSpecialization,
  interactive = false,
}: BranchSvgRendererProps) => {
  const getNodeState = (index: number): NodeState => nodes[index]?.state || 'locked';

  switch (attribute) {
    case 'mind':
      return (
        <MindBranchSvg
          firstThoughtState={getNodeState(0)}
          scholarState={getNodeState(1)}
          explorerState={getNodeState(2)}
          scholarsCrownState={getNodeState(3)}
          explorersCompassState={getNodeState(4)}
          selectedSpecialization={selectedSpecialization}
          interactive={interactive}
        />
      );
    case 'body':
      return (
        <BodyBranchSvg
          originState={getNodeState(0)}
          enduranceState={getNodeState(1)}
          mobilityState={getNodeState(2)}
          enduranceCrestState={getNodeState(3)}
          mobilityCrestState={getNodeState(4)}
          selectedSpecialization={selectedSpecialization}
          interactive={interactive}
        />
      );
    case 'will':
      return (
        <WillBranchSvg
          originState={getNodeState(0)}
          focusState={getNodeState(1)}
          courageState={getNodeState(2)}
          focusCrestState={getNodeState(3)}
          courageCrestState={getNodeState(4)}
          selectedSpecialization={selectedSpecialization}
          interactive={interactive}
        />
      );
    case 'craft':
      return (
        <CraftBranchSvg
          originState={getNodeState(0)}
          builderState={getNodeState(1)}
          artisanState={getNodeState(2)}
          builderCrestState={getNodeState(3)}
          artisanCrestState={getNodeState(4)}
          selectedSpecialization={selectedSpecialization}
          interactive={interactive}
        />
      );
    default:
      return null;
  }
};
