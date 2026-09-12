export type AttributeId = 'mind' | 'body' | 'will' | 'craft';

export type Specialization =
  | 'scholar'
  | 'explorer'
  | 'endurance'
  | 'mobility'
  | 'focus'
  | 'courage'
  | 'builder'
  | 'artisan';

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

// Backward compatibility alias
export type MindNodeInfo = RootNodeInfo;

// Canonical BranchState matching Smarak's docs/CONTRACTS.md contract
export interface BranchState {
  attribute: AttributeId;
  xp: number;
  mindXP?: number; // legacy alias
  specialization: Specialization | null;
  selectedSpecialization?: Specialization | null; // legacy alias getter
  selectedAt?: string | null;
  sproutAvailable?: boolean;
  specializationAvailable: boolean;
  crestAvailable?: boolean;
  trialStarted?: boolean;
  trialComplete?: boolean;
  crestClaimed?: boolean;
}

// Backward compatibility alias
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
