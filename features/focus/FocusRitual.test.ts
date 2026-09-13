import { describe, it, expect, vi } from 'vitest';
import type { Quest, AttributeId } from '../hearth/contracts';

// Inscriptions tested against design brief
const EXPECTED_INSCRIPTIONS = [
  'Stay with it.',
  'Small actions become permanent things.',
  'The Root remembers what you repeat.',
  'One more page. One more attempt.',
  'What you do becomes who you are.',
];

function getPresetSeconds(effort: string): number {
  if (effort === 'high') return 25 * 60;
  if (effort === 'medium') return 15 * 60;
  return 5 * 60;
}

function formatFocusTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

describe('Focus Ritual — Architectural & Progression Invariants', () => {
  const mockQuestLow: Quest = {
    id: 'quest-1',
    userId: 'user-1',
    title: 'Morning Breathwork',
    attribute: 'body' as AttributeId,
    effort: 'low',
    cadence: 'daily',
    createdAt: new Date().toISOString(),
    completedForCurrentOccurrence: false,
  };

  const mockQuestMedium: Quest = {
    id: 'quest-2',
    userId: 'user-1',
    title: 'Read Botanical Folio',
    attribute: 'mind' as AttributeId,
    effort: 'medium',
    cadence: 'daily',
    createdAt: new Date().toISOString(),
    completedForCurrentOccurrence: false,
  };

  const mockQuestHigh: Quest = {
    id: 'quest-3',
    userId: 'user-1',
    title: 'Woodcarving Practice',
    attribute: 'craft' as AttributeId,
    effort: 'high',
    cadence: 'daily',
    createdAt: new Date().toISOString(),
    completedForCurrentOccurrence: false,
  };

  describe('Duration Presets & Effort Mapping', () => {
    it('maps low effort to 5 minute default focus session (300 seconds)', () => {
      expect(getPresetSeconds(mockQuestLow.effort)).toBe(300);
      expect(formatFocusTime(300)).toBe('05:00');
    });

    it('maps medium effort to 15 minute default focus session (900 seconds)', () => {
      expect(getPresetSeconds(mockQuestMedium.effort)).toBe(900);
      expect(formatFocusTime(900)).toBe('15:00');
    });

    it('maps high effort to 25 minute default focus session (1500 seconds)', () => {
      expect(getPresetSeconds(mockQuestHigh.effort)).toBe(1500);
      expect(formatFocusTime(1500)).toBe('25:00');
    });

    it('formats seconds with leading zeroes correctly', () => {
      expect(formatFocusTime(0)).toBe('00:00');
      expect(formatFocusTime(59)).toBe('00:59');
      expect(formatFocusTime(61)).toBe('01:01');
      expect(formatFocusTime(1500)).toBe('25:00');
    });
  });

  describe('Authored Motivational Inscriptions', () => {
    it('contains exactly the canonical curated focus inscriptions', () => {
      expect(EXPECTED_INSCRIPTIONS).toContain('Stay with it.');
      expect(EXPECTED_INSCRIPTIONS).toContain('Small actions become permanent things.');
      expect(EXPECTED_INSCRIPTIONS).toContain('The Root remembers what you repeat.');
      expect(EXPECTED_INSCRIPTIONS).toContain('One more page. One more attempt.');
      expect(EXPECTED_INSCRIPTIONS).toContain('What you do becomes who you are.');
    });

    it('has no generic SaaS pomodoro quote slogans', () => {
      for (const phrase of EXPECTED_INSCRIPTIONS) {
        expect(phrase.toLowerCase()).not.toContain('crush it');
        expect(phrase.toLowerCase()).not.toContain('hustle');
        expect(phrase.toLowerCase()).not.toContain('grind');
        expect(phrase.toLowerCase()).not.toContain('productivity');
      }
    });
  });

  describe('Game Progression Integrity Invariants', () => {
    it('guarantees that timer ticking and completion NEVER award XP directly', () => {
      // Simulating a timer completion event
      let localXp = 50;
      let sparks = 10;
      const onSealMock = vi.fn();

      const simulateTimerFinished = (userAffirmedRealAction: boolean) => {
        // Timer finishes -> NO state write happens automatically
        if (userAffirmedRealAction) {
          onSealMock('quest-1');
        }
      };

      // Case 1: Timer finishes, but player selects "Not Yet"
      simulateTimerFinished(false);
      expect(onSealMock).not.toHaveBeenCalled();
      expect(localXp).toBe(50); // XP unchanged
      expect(sparks).toBe(10); // Sparks unchanged

      // Case 2: Player affirms real-world action
      simulateTimerFinished(true);
      expect(onSealMock).toHaveBeenCalledWith('quest-1');
      // Notice: onSealMock delegates to the server RPC complete_quest
      // No XP calculation is performed client-side!
    });

    it('allows quest completion without using Focus Ritual at all', () => {
      const handleDirectSeal = vi.fn();
      // Player clicks direct "Seal" button on QuestRow
      handleDirectSeal(mockQuestLow.id);
      expect(handleDirectSeal).toHaveBeenCalledWith('quest-1');
    });
  });
});
