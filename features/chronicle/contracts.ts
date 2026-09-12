import type { AttributeId, Effort } from '@/game/contracts';

export interface ChronicleEntry {
  id: string;
  questId: string;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  xpAwarded: number;
  sparksAwarded: number;
  localDate: string;
  completedAt: string;
}

export interface ChronicleAchievement {
  id: 'first_light' | 'chosen_path' | 'returned';
  title: string;
  description: string;
  glyph: string;
  unlocked: boolean;
  unlockedAt: string | null;
}
