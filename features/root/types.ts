export type AttributeId = 'mind' | 'body' | 'will' | 'craft';

export type SpecializationId =
  | 'scholar'
  | 'explorer'
  | 'endurance'
  | 'mobility'
  | 'focus'
  | 'courage'
  | 'builder'
  | 'artisan';

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
  specializationKey?: SpecializationId;
  state: NodeState;
  xpRequired: number;
  description: string;
  coordinates: NodeCoordinates;
}

// Backward compatibility alias for MindNodeInfo
export type MindNodeInfo = RootNodeInfo;

export interface BranchState {
  attribute: AttributeId;
  xp: number;
  mindXP?: number;
  selectedSpecialization: SpecializationId | null;
  specializationAvailable: boolean;
}

// Backward compatibility alias for MindBranchState
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
      id: SpecializationId;
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
      id: SpecializationId;
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
