export type SpecializationId = 'scholar' | 'explorer';

export type NodeState = 'locked' | 'available' | 'unlocked' | 'selected';

export type MindNodeId =
  | 'first_thought'
  | 'scholar'
  | 'explorer'
  | 'scholars_crown'
  | 'explorers_compass';

export interface MindNodeInfo {
  id: MindNodeId;
  label: string;
  subtitle: string;
  type: 'origin' | 'specialization' | 'crest';
  specializationKey?: SpecializationId;
  state: NodeState;
  xpRequired: number;
  description: string;
  coordinates: {
    x: number;
    y: number;
    percentX: number;
    percentY: number;
  };
}

export interface MindBranchState {
  attribute: 'mind';
  mindXP: number;
  selectedSpecialization: SpecializationId | null;
  specializationAvailable: boolean;
}

export interface MindRootProps {
  state: MindBranchState;
  onSelectSpecialization?: (spec: SpecializationId) => void;
  className?: string;
}
