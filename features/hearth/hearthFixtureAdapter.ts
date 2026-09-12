import type {
  Effort,
  EmberState,
  GameSnapshot,
  MutationEvent,
  MutationResult,
} from '../../game/contracts';

/**
 * Fixture completion simulation generator.
 * Strictly for local visual mock previews and unit tests.
 */
export function simulateServerCompletion(
  currentSnapshot: GameSnapshot,
  questId: string,
  shouldFail = false
): Promise<MutationResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Network connection interrupted while kindling the Ember.'));
        return;
      }

      const quest = currentSnapshot.quests?.find((q) => q.id === questId);
      if (!quest) {
        reject(new Error('Quest not found in authoritative records.'));
        return;
      }

      const xpValues: Record<Effort, number> = {
        quick: 10,
        standard: 20,
        deep: 35,
      };
      const awardedXp = xpValues[quest.effort] || 20;
      const awardedSparks = Math.floor(awardedXp / 5);

      const prevLevel = currentSnapshot.level;
      const newTotalXp = currentSnapshot.totalXp + awardedXp;
      const newLevel = newTotalXp >= 100 ? 2 : 1;

      const currentBranch = currentSnapshot.branches[quest.attribute];
      const newBranchXp = currentBranch.xp + awardedXp;
      const specializationAvailable = newBranchXp >= 80 && currentBranch.specialization === null;

      const emberTransitions: Record<EmberState, EmberState> = {
        resting: 'kindled',
        kindled: 'steady',
        steady: 'bright',
        bright: 'bright',
      };
      const nextEmberState = emberTransitions[currentSnapshot.emberState] || 'kindled';

      const updatedQuests = (currentSnapshot.quests || []).map((q) =>
        q.id === questId ? { ...q, completedForCurrentOccurrence: true } : q
      );

      const nextSnapshot: GameSnapshot = {
        ...currentSnapshot,
        revision: currentSnapshot.revision + 1,
        totalXp: newTotalXp,
        level: newLevel,
        sparksBalance: currentSnapshot.sparksBalance + awardedSparks,
        emberState: nextEmberState,
        todayXpAwarded: currentSnapshot.todayXpAwarded + awardedXp,
        branches: {
          ...currentSnapshot.branches,
          [quest.attribute]: {
            ...currentBranch,
            xp: newBranchXp,
            sproutAvailable: true,
            specializationAvailable,
          },
        },
        quests: updatedQuests,
      };

      const event: MutationEvent = {
        id: `evt-${Date.now()}`,
        kind: 'quest_completed',
        xpAwarded: awardedXp,
        sparksAwarded: awardedSparks,
        previousLevel: prevLevel,
        newLevel: newLevel,
        attribute: quest.attribute,
        specializationAvailable,
        emberState: nextEmberState,
        emberRelit: currentSnapshot.emberState === 'resting' && currentSnapshot.currentStreak > 0,
      };

      resolve({
        revision: nextSnapshot.revision,
        event,
        snapshot: nextSnapshot,
      });
    }, 250);
  });
}
