import { Specialization, TrialKind } from '../../game/contracts';

export interface TrialConfigInfo {
  specialization: Specialization;
  kind: TrialKind;
  requiredDays?: number;
  title: string;
  subtitle: string;
  description: string;
  evidencePrompt: string;
  crestName: string;
}

export const TRIAL_CONFIGS: Record<Specialization, TrialConfigInfo> = {
  scholar: {
    specialization: 'scholar',
    kind: 'distinct_days',
    requiredDays: 5,
    title: 'Trial of the Scholar',
    subtitle: '5 Distinct Study Days',
    description: 'Demonstrate disciplined learning across 5 distinct days of study to prove mental mastery.',
    evidencePrompt: 'Record your study session topic or reading progress.',
    crestName: "Scholar's Crown",
  },
  explorer: {
    specialization: 'explorer',
    kind: 'milestone_reflection',
    title: 'Trial of the Explorer',
    subtitle: 'Milestone Discovery Reflection',
    description: 'Declare a significant new domain, insight, or conceptual milestone explored.',
    evidencePrompt: 'Describe the milestone or domain you explored.',
    crestName: "Explorer's Compass",
  },
  endurance: {
    specialization: 'endurance',
    kind: 'distinct_days',
    requiredDays: 5,
    title: 'Trial of Endurance',
    subtitle: '5 Distinct Stamina Days',
    description: 'Prove physical stamina across 5 distinct days of sustained physical effort.',
    evidencePrompt: 'Record your stamina activity or physical training effort.',
    crestName: 'Endurance Aegis',
  },
  mobility: {
    specialization: 'mobility',
    kind: 'milestone_reflection',
    title: 'Trial of Mobility',
    subtitle: 'Milestone Movement Reflection',
    description: 'Declare a breakthrough milestone in movement, flexibility, or physical agility.',
    evidencePrompt: 'Describe your physical mobility breakthrough.',
    crestName: 'Mobility Wing',
  },
  focus: {
    specialization: 'focus',
    kind: 'distinct_days',
    requiredDays: 5,
    title: 'Trial of Focus',
    subtitle: '5 Distinct Focus Days',
    description: 'Maintain uninterrupted concentration across 5 distinct days of deep focus.',
    evidencePrompt: 'Record your deep focus work session.',
    crestName: 'Focus Prism',
  },
  courage: {
    specialization: 'courage',
    kind: 'milestone_reflection',
    title: 'Trial of Courage',
    subtitle: 'Milestone Valor Reflection',
    description: 'Declare a difficult, daunting task or fear confronted directly.',
    evidencePrompt: 'Describe the daunting challenge you confronted.',
    crestName: 'Courage Shield',
  },
  builder: {
    specialization: 'builder',
    kind: 'distinct_days',
    requiredDays: 5,
    title: 'Trial of the Builder',
    subtitle: '5 Distinct Build Days',
    description: 'Construct tangible systems or code across 5 distinct days of building.',
    evidencePrompt: 'Record the module, component, or system you built.',
    crestName: "Builder's Keystone",
  },
  artisan: {
    specialization: 'artisan',
    kind: 'milestone_reflection',
    title: 'Trial of the Artisan',
    subtitle: 'Milestone Craftsmanship Reflection',
    description: 'Reflect on a completed piece of refined craft, design, or art.',
    evidencePrompt: 'Describe your refined piece of craftsmanship.',
    crestName: "Artisan's Anvil",
  },
};
