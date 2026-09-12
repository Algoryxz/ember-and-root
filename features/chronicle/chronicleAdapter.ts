import type { GameSnapshot } from '@/game/contracts';
import type { ChronicleEntry, ChronicleAchievement } from './contracts';

/**
 * Derives the three canonical achievements from immutable history and branch progression.
 * Never stores derived achievement state independently in the database.
 */
export function deriveAchievements(
  snapshot: GameSnapshot,
  entries: ChronicleEntry[]
): ChronicleAchievement[] {
  // 1. First Light: complete your first quest
  const earliestCompletion =
    entries.length > 0
      ? [...entries].sort(
          (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        )[0]
      : null;
  const hasFirstLight = entries.length > 0;

  // 2. A Chosen Path: choose your first specialization on any branch
  let chosenBranchKey: string | null = null;
  let chosenBranchTime: string | null = null;
  if (snapshot.branches) {
    for (const [key, branch] of Object.entries(snapshot.branches)) {
      if (branch.specialization) {
        chosenBranchKey = key;
        chosenBranchTime = branch.selectedAt || null;
        break;
      }
    }
  }
  const hasChosenPath = Boolean(chosenBranchKey);

  // 3. Returned: complete a quest after a missed day (streak restart or gap in completions)
  let hasReturned = false;
  let returnedTime: string | null = null;

  if (entries.length >= 2) {
    // Sort chronological ascending to inspect date gaps
    const sorted = [...entries].sort(
      (a, b) => new Date(a.localDate).getTime() - new Date(b.localDate).getTime()
    );

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].localDate);
      const currDate = new Date(sorted[i].localDate);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 2) {
        hasReturned = true;
        returnedTime = sorted[i].completedAt;
        break;
      }
    }
  }

  return [
    {
      id: 'first_light',
      title: 'First Light',
      description: 'Inscribe and seal your very first daily practice.',
      glyph: '🕯️',
      unlocked: hasFirstLight,
      unlockedAt: earliestCompletion?.completedAt || null,
    },
    {
      id: 'chosen_path',
      title: 'A Chosen Path',
      description: 'Commit to your first specialization fork upon the Root.',
      glyph: '🌿',
      unlocked: hasChosenPath,
      unlockedAt: chosenBranchTime,
    },
    {
      id: 'returned',
      title: 'Returned',
      description: 'Rekindle the Ember flame after a day away.',
      glyph: '🔥',
      unlocked: hasReturned,
      unlockedAt: returnedTime,
    },
  ];
}
