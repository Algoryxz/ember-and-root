import { STARTER_QUEST_CATALOG } from './starterQuestCatalog';
import type {
  AvailableMinutes,
  GoalId,
  Intensity,
  StarterQuestTemplate,
} from './types';

export interface RecommendStarterQuestsInput {
  selectedGoals: GoalId[];
  intensity: Intensity;
  availableMinutes: AvailableMinutes;
  catalog?: StarterQuestTemplate[];
}

function scoreIntensity(template: StarterQuestTemplate, target: Intensity): number {
  if (target === 'light') {
    if (template.effort === 'quick') return 4;
    if (template.effort === 'standard') return 2;
    return 0;
  }
  if (target === 'balanced') {
    if (template.effort === 'standard') return 4;
    if (template.effort === 'quick') return 2;
    return 1;
  }
  // push
  if (template.effort === 'deep') return 4;
  if (template.effort === 'standard') return 3;
  return 0;
}

function scoreDuration(template: StarterQuestTemplate, target: AvailableMinutes): number {
  const mins = template.estimatedMinutes;
  switch (target) {
    case '5-15':
      if (mins <= 15) return 4;
      if (mins <= 25) return 1;
      return 0;
    case '15-30':
      if (mins >= 15 && mins <= 30) return 4;
      if (mins < 15) return 2;
      return 1;
    case '30-60':
      if (mins >= 25 && mins <= 60) return 4;
      if (mins < 25) return 1;
      return 2;
    case '60+':
      if (mins >= 45) return 4;
      if (mins >= 25) return 2;
      return 1;
    default:
      return 2;
  }
}

/**
 * Pure deterministic recommendation engine for starter quests.
 *
 * Requirements:
 * 1. Filter by selected goals.
 * 2. Score intensity match.
 * 3. Score duration match.
 * 4. Represent >= 2 selected goals where possible.
 * 5. Avoid > 2 same-attribute quests unless selections require it.
 * 6. Produce 3-5 suggestions with stable sorting.
 */
export function recommendStarterQuests(input: RecommendStarterQuestsInput): StarterQuestTemplate[] {
  const {
    selectedGoals,
    intensity,
    availableMinutes,
    catalog = STARTER_QUEST_CATALOG,
  } = input;

  if (!selectedGoals || selectedGoals.length === 0) {
    return [];
  }

  // 1. Filter candidates for selected goals
  const goalSet = new Set(selectedGoals);
  const eligible = catalog.filter((t) => goalSet.has(t.goalId));

  if (eligible.length === 0) {
    return [];
  }

  // 2. Score candidates
  type ScoredTemplate = {
    template: StarterQuestTemplate;
    score: number;
  };

  const scored: ScoredTemplate[] = eligible.map((t) => {
    const iScore = scoreIntensity(t, intensity);
    const dScore = scoreDuration(t, availableMinutes);
    const exactIntensityBonus = t.intensity === intensity ? 2 : 0;
    return {
      template: t,
      score: iScore + dScore + exactIntensityBonus,
    };
  });

  // Sort deterministically: score DESC, then template.id ASC
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.template.id.localeCompare(b.template.id);
  });

  // Calculate unique attributes in selected goals to determine if attribute diversity is feasible
  const selectedAttributes = new Set(eligible.map((t) => t.attribute));
  const canEnforceAttributeCap = selectedAttributes.size > 1;

  // 3. Represent as many distinct goals as possible (up to 4)
  const selectedTemplates: StarterQuestTemplate[] = [];
  const coveredGoals = new Set<GoalId>();
  const attributeCounts: Record<string, number> = {
    mind: 0,
    body: 0,
    will: 0,
    craft: 0,
  };

  // Pass 1: Select the top-scoring quest from each distinct selected goal
  for (const goalId of selectedGoals) {
    const candidatesForGoal = scored.filter(
      (s) => s.template.goalId === goalId && !selectedTemplates.some((st) => st.id === s.template.id)
    );

    for (const candidate of candidatesForGoal) {
      const attr = candidate.template.attribute;
      if (canEnforceAttributeCap && (attributeCounts[attr] || 0) >= 2) {
        continue;
      }

      selectedTemplates.push(candidate.template);
      coveredGoals.add(goalId);
      attributeCounts[attr] = (attributeCounts[attr] || 0) + 1;
      break;
    }
  }

  // Pass 2: If we still have fewer than 3 (or if we can fit up to 4 or 5 suggestions),
  // fill in the highest scoring remaining candidates respecting diversity constraints
  const targetMin = Math.min(3, eligible.length);
  const targetMax = Math.min(4, eligible.length);

  for (const candidate of scored) {
    if (selectedTemplates.length >= targetMax) break;
    if (selectedTemplates.some((st) => st.id === candidate.template.id)) continue;

    const attr = candidate.template.attribute;
    if (canEnforceAttributeCap && (attributeCounts[attr] || 0) >= 2 && selectedTemplates.length >= targetMin) {
      continue;
    }

    selectedTemplates.push(candidate.template);
    attributeCounts[attr] = (attributeCounts[attr] || 0) + 1;
  }

  // If still under 3 due to strict cap, relax cap to reach at least 3
  if (selectedTemplates.length < targetMin) {
    for (const candidate of scored) {
      if (selectedTemplates.length >= targetMin) break;
      if (selectedTemplates.some((st) => st.id === candidate.template.id)) continue;
      selectedTemplates.push(candidate.template);
    }
  }

  // Ensure deterministic final order: by goal order as selected, then id
  return selectedTemplates.sort((a, b) => {
    const goalIdxA = selectedGoals.indexOf(a.goalId);
    const goalIdxB = selectedGoals.indexOf(b.goalId);
    if (goalIdxA !== goalIdxB) return goalIdxA - goalIdxB;
    return a.id.localeCompare(b.id);
  });
}
