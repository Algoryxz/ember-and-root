import { AttributeId, BranchConfig } from './types';

export const BRANCH_CONFIGS: Record<AttributeId, BranchConfig> = {
  mind: {
    attribute: 'mind',
    title: 'Mind Branch',
    subtitle: 'Intellect, Knowledge & Focus',
    accentColor: '#9FBA87',
    originNode: {
      id: 'first_thought',
      label: 'First Thought',
      subtitle: 'Origin Sprout',
      description: 'The initial spark of intellectual inquiry and mental dedication.',
    },
    specializations: [
      {
        id: 'scholar',
        label: 'Scholar',
        subtitle: 'Path of Deep Study',
        description: 'Dedicate your mind to rigorous analysis, reflection, and theory.',
        crest: {
          id: 'scholars_crown',
          label: "Scholar's Crown",
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Scholar Trial mastery.',
        },
      },
      {
        id: 'explorer',
        label: 'Explorer',
        subtitle: 'Path of Discovery',
        description: 'Expand your mental horizons through broad experimentation and curiosity.',
        crest: {
          id: 'explorers_compass',
          label: "Explorer's Compass",
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Explorer Trial mastery.',
        },
      },
    ],
  },
  body: {
    attribute: 'body',
    title: 'Body Branch',
    subtitle: 'Vitality, Stamina & Movement',
    accentColor: '#E98A4B',
    originNode: {
      id: 'rooted_stance',
      label: 'Rooted Stance',
      subtitle: 'Vital Sprout',
      description: 'The foundation of physical strength, balance, and endurance.',
    },
    specializations: [
      {
        id: 'endurance',
        label: 'Endurance',
        subtitle: 'Path of Resilience',
        description: 'Build unwavering physical stamina and fortitude through sustained effort.',
        crest: {
          id: 'endurance_aegis',
          label: 'Endurance Aegis',
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Endurance Trial mastery.',
        },
      },
      {
        id: 'mobility',
        label: 'Mobility',
        subtitle: 'Path of Agility',
        description: 'Master movement, flexibility, and physical responsiveness.',
        crest: {
          id: 'mobility_wing',
          label: 'Mobility Wing',
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Mobility Trial mastery.',
        },
      },
    ],
  },
  will: {
    attribute: 'will',
    title: 'Will Branch',
    subtitle: 'Resolve, Focus & Inner Fortitude',
    accentColor: '#FFD38A',
    originNode: {
      id: 'iron_intent',
      label: 'Iron Intent',
      subtitle: 'Purpose Sprout',
      description: 'The unwavering commitment to self-discipline and purpose.',
    },
    specializations: [
      {
        id: 'focus',
        label: 'Focus',
        subtitle: 'Path of Clarity',
        description: 'Hone deep concentration and resist distractions.',
        crest: {
          id: 'focus_prism',
          label: 'Focus Prism',
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Focus Trial mastery.',
        },
      },
      {
        id: 'courage',
        label: 'Courage',
        subtitle: 'Path of Valor',
        description: 'Confront difficult tasks directly with boldness and resolve.',
        crest: {
          id: 'courage_shield',
          label: 'Courage Shield',
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Courage Trial mastery.',
        },
      },
    ],
  },
  craft: {
    attribute: 'craft',
    title: 'Craft Branch',
    subtitle: 'Creation, Artistry & Skill',
    accentColor: '#D9E3B2',
    originNode: {
      id: 'first_spark',
      label: 'First Spark',
      subtitle: 'Maker Sprout',
      description: 'The initial impulse to design, build, and refine tangible creations.',
    },
    specializations: [
      {
        id: 'builder',
        label: 'Builder',
        subtitle: 'Path of Structure',
        description: 'Construct enduring systems, architecture, and tools.',
        crest: {
          id: 'builders_keystone',
          label: "Builder's Keystone",
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Builder Trial mastery.',
        },
      },
      {
        id: 'artisan',
        label: 'Artisan',
        subtitle: 'Path of Artistry',
        description: 'Refine craft with elegance, nuance, and expressive detail.',
        crest: {
          id: 'artisans_anvil',
          label: "Artisan's Anvil",
          subtitle: 'Mastery Crest',
          description: 'Permanent Crest awarded for complete Artisan Trial mastery.',
        },
      },
    ],
  },
};
