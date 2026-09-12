import type { AttributeId, Effort, Cadence } from '@/game/contracts';

export type GoalId =
  | 'study_consistently'
  | 'improve_focus'
  | 'read_more'
  | 'get_stronger'
  | 'move_more'
  | 'sleep_better'
  | 'build_discipline'
  | 'reduce_screen_time'
  | 'build_confidence'
  | 'organize_life'
  | 'learn_skill'
  | 'be_creative'
  | 'build_project';

export interface Goal {
  id: GoalId;
  title: string;
  attribute: AttributeId;
  description: string;
  reflectionPrompt: string;
}

export type Intensity = 'light' | 'balanced' | 'push';

export type AvailableMinutes = '5-15' | '15-30' | '30-60' | '60+';

export type PreferredRhythm = 'morning' | 'afternoon' | 'evening' | 'flexible';

export interface StarterQuestTemplate {
  id: string;
  goalId: GoalId;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  estimatedMinutes: number;
  intensity: Intensity;
  description: string;
}

export interface OnboardingPreferences {
  version: 2;
  goals: GoalId[];
  intensity: Intensity;
  availableMinutes: AvailableMinutes;
  preferredTime: PreferredRhythm;
  starterTemplateIds: string[];
}

export type OnboardingStep =
  | 'goals'
  | 'intensity'
  | 'time'
  | 'quests'
  | 'timezone'
  | 'first_quest'
  | 'sealed';
