import { describe, it, expect } from 'vitest';
import { recommendStarterQuests } from './recommendStarterQuests';
import { STARTER_QUEST_CATALOG } from './starterQuestCatalog';

describe('Starter Quest Recommendation Engine', () => {
  it('returns empty array when no goals are provided', () => {
    const result = recommendStarterQuests({
      selectedGoals: [],
      intensity: 'balanced',
      availableMinutes: '15-30',
    });
    expect(result).toEqual([]);
  });

  it('produces 3-5 suggestions for standard 2-4 selected goals', () => {
    const result = recommendStarterQuests({
      selectedGoals: ['study_consistently', 'move_more', 'build_discipline'],
      intensity: 'balanced',
      availableMinutes: '15-30',
    });

    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('is strictly deterministic across multiple identical invocations', () => {
    const input = {
      selectedGoals: ['improve_focus', 'get_stronger', 'learn_skill'] as const,
      intensity: 'push' as const,
      availableMinutes: '30-60' as const,
    };

    const run1 = recommendStarterQuests({ ...input, selectedGoals: [...input.selectedGoals] });
    const run2 = recommendStarterQuests({ ...input, selectedGoals: [...input.selectedGoals] });
    const run3 = recommendStarterQuests({ ...input, selectedGoals: [...input.selectedGoals] });

    expect(run1.map((q) => q.id)).toEqual(run2.map((q) => q.id));
    expect(run2.map((q) => q.id)).toEqual(run3.map((q) => q.id));
  });

  it('represents >= 2 selected goals when multiple goals are provided', () => {
    const selectedGoals = ['study_consistently', 'get_stronger', 'build_discipline'] as const;
    const result = recommendStarterQuests({
      selectedGoals: [...selectedGoals],
      intensity: 'balanced',
      availableMinutes: '15-30',
    });

    const representedGoals = new Set(result.map((q) => q.goalId));
    expect(representedGoals.size).toBeGreaterThanOrEqual(2);
  });

  it('respects attribute diversity: avoids > 2 same-attribute quests when goals span multiple attributes', () => {
    // 3 goals from mind, 1 from body
    const result = recommendStarterQuests({
      selectedGoals: ['study_consistently', 'improve_focus', 'read_more', 'get_stronger'],
      intensity: 'balanced',
      availableMinutes: '15-30',
    });

    const attributeCounts = result.reduce<Record<string, number>>((acc, q) => {
      acc[q.attribute] = (acc[q.attribute] || 0) + 1;
      return acc;
    }, {});

    expect(attributeCounts['mind']).toBeLessThanOrEqual(2);
    expect(attributeCounts['body']).toBeGreaterThanOrEqual(1);
  });

  it('favors quick effort for "light" intensity and short duration', () => {
    const result = recommendStarterQuests({
      selectedGoals: ['study_consistently', 'move_more'],
      intensity: 'light',
      availableMinutes: '5-15',
    });

    // Top recommended quests should include quick effort
    const quickQuests = result.filter((q) => q.effort === 'quick');
    expect(quickQuests.length).toBeGreaterThanOrEqual(1);
    expect(result.some((q) => q.estimatedMinutes <= 15)).toBe(true);
  });

  it('favors deep or standard effort for "push" intensity and long duration', () => {
    const result = recommendStarterQuests({
      selectedGoals: ['get_stronger', 'learn_skill'],
      intensity: 'push',
      availableMinutes: '60+',
    });

    const deepOrStandard = result.filter((q) => q.effort === 'deep' || q.effort === 'standard');
    expect(deepOrStandard.length).toBe(result.length);
  });

  it('handles all goals in catalog correctly', () => {
    // Every goal in catalog should be recommendable when chosen
    for (const item of STARTER_QUEST_CATALOG) {
      const res = recommendStarterQuests({
        selectedGoals: [item.goalId, 'build_discipline'],
        intensity: item.intensity,
        availableMinutes: '15-30',
      });
      expect(res.length).toBeGreaterThanOrEqual(2);
    }
  });
});
