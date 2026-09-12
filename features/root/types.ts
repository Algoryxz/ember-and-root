import { AttributeId, BranchState as GameBranchState, Specialization } from '../../game/contracts';

export type { AttributeId, Specialization, TrialKind, TrialState, GameSnapshot, MutationResult } from '../../game/contracts';

// Backward compatibility alias
export type SpecializationId = Specialization;

export type NodeState = 'locked' | 'available' | 'unlocked' | 'selected';

export type NodeType = 'origin' | 'specialization' | 'crest';

export interface NodeCoordinates {
  x: number;
  y: number;
  percentX: number;
  percentY: number;
}

export interface RootNodeInfo {
  id: string;
  label: string;
  subtitle: string;
  type: NodeType;
  specializationKey?: Specialization;
  state: NodeState;
  xpRequired: number;
  description: string;
  coordinates: NodeCoordinates;
}

export type MindNodeInfo = RootNodeInfo;

// BranchState matching game/contracts.ts with compatibility aliases
export interface BranchState extends GameBranchState {
  mindXP?: number;
  selectedSpecialization?: Specialization | null;
}

export type MindBranchState = BranchState;

export interface BranchConfig {
  attribute: AttributeId;
  title: string;
  subtitle: string;
  accentColor: string;
  originNode: {
    id: string;
    label: string;
    subtitle: string;
    description: string;
  };
  specializations: [
    {
      id: Specialization;
      label: string;
      subtitle: string;
      description: string;
      crest: {
        id: string;
        label: string;
        subtitle: string;
        description: string;
      };
    },
    {
      id: Specialization;
      label: string;
      subtitle: string;
      description: string;
      crest: {
        id: string;
        label: string;
        subtitle: string;
        description: string;
      };
    }
  ];
}

export interface RootTreeState {
  branches: Record<AttributeId, BranchState>;
}
