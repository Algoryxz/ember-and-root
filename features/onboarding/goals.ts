import type { Goal } from './types';

export const ONBOARDING_GOALS: Goal[] = [
  // Mind
  {
    id: 'study_consistently',
    title: 'Study consistently',
    attribute: 'mind',
    description: 'Establish a reliable intellectual cadence without burnout or delay.',
    reflectionPrompt: 'What domain of knowledge calls for your dedicated attention?',
  },
  {
    id: 'improve_focus',
    title: 'Improve focus',
    attribute: 'mind',
    description: 'Train sustained attention through single-tasking and deliberate presence.',
    reflectionPrompt: 'Where does your mind wander when real work begins?',
  },
  {
    id: 'read_more',
    title: 'Read more',
    attribute: 'mind',
    description: 'Return to enduring texts, essays, and books that deepen your understanding.',
    reflectionPrompt: 'Which pages have you postponed reading for too long?',
  },

  // Body
  {
    id: 'get_stronger',
    title: 'Get stronger',
    attribute: 'body',
    description: 'Engage in deliberate resistance and physical exertion that builds raw capacity.',
    reflectionPrompt: 'How will your physical frame answer today’s quiet demands?',
  },
  {
    id: 'move_more',
    title: 'Move more',
    attribute: 'body',
    description: 'Break sedentary stagnation with walks, stretches, and natural mobility.',
    reflectionPrompt: 'When was the last time movement felt refreshing rather than obligatory?',
  },
  {
    id: 'sleep_better',
    title: 'Sleep better',
    attribute: 'body',
    description: 'Protect nocturnal rest with deliberate wind-downs and restorative boundaries.',
    reflectionPrompt: 'What evening rituals genuinely restore your energy?',
  },

  // Will
  {
    id: 'build_discipline',
    title: 'Build discipline',
    attribute: 'will',
    description: 'Choose what matters over what is convenient, one small promise at a time.',
    reflectionPrompt: 'Which quiet promise to yourself needs keeping today?',
  },
  {
    id: 'reduce_screen_time',
    title: 'Reduce screen time',
    attribute: 'will',
    description: 'Reclaim quiet hours from endless feeds and reactive algorithmic noise.',
    reflectionPrompt: 'What intentional reality replaces an hour of passive glow?',
  },
  {
    id: 'build_confidence',
    title: 'Build confidence',
    attribute: 'will',
    description: 'Step toward discomfort and speak, act, or decide with steady conviction.',
    reflectionPrompt: 'What hesitation can be dissolved by one clear act?',
  },
  {
    id: 'organize_life',
    title: 'Organize my life',
    attribute: 'will',
    description: 'Clear the clutter from your environment, schedules, and mental queue.',
    reflectionPrompt: 'Which disordered corner or inbox drains your clarity?',
  },

  // Craft
  {
    id: 'learn_skill',
    title: 'Learn a skill',
    attribute: 'craft',
    description: 'Acquire practical mastery in code, language, music, or physical craft.',
    reflectionPrompt: 'What practical craft do your hands or mind wish to wield?',
  },
  {
    id: 'be_creative',
    title: 'Be more creative',
    attribute: 'craft',
    description: 'Generate original expressions through writing, drawing, or design without fear.',
    reflectionPrompt: 'What raw idea wants to take visible shape today?',
  },
  {
    id: 'build_project',
    title: 'Build a personal project',
    attribute: 'craft',
    description: 'Bring an enduring creation into the world through consistent iterative steps.',
    reflectionPrompt: 'What tangible milestone brings your artifact closer to completion?',
  },
];

export const GOALS_BY_ID = new Map(ONBOARDING_GOALS.map((g) => [g.id, g]));
