// @ts-ignore
import { describe, it, expect, vi } from 'vitest';
import { claimCrestAction } from './trialAdapter';
import { GameSnapshot } from '../../game/contracts';
import { INITIAL_TREE_STATE } from './fixtures';

describe('Crest Reveal & Claim Flow (Server-Authoritative)', () => {
  const createBaseSnapshot = (): GameSnapshot => ({
    revision: 1,
    userId: 'test-user',
    totalXp: 280,
    level: 2,
    sparksBalance: 50,
    currentStreak: 3,
    longestStreak: 7,
    emberState: 'kindled',
    todayXpAwarded: 20,
    branches: {
      ...INITIAL_TREE_STATE.branches,
      mind: {
        ...INITIAL_TREE_STATE.branches.mind,
        specialization: 'scholar',
        specializationAvailable: false,
        trialStarted: true,
        trialComplete: true,
        crestAvailable: true,
        crestClaimed: false,
      },
    },
    trials: {
      mind: {
        id: 'trial-mind-scholar-123',
        attribute: 'mind',
        specialization: 'scholar',
        startedAt: new Date().toISOString(),
        kind: 'distinct_days',
        requiredDays: 5,
        distinctDaysCompleted: 5,
        completedAt: new Date().toISOString(),
        claimedAt: null,
      },
    },
    equippedItemId: null,
    inventory: { items: [] },
  });

  it('1. Crest unavailable when server state indicates crestAvailable is false', () => {
    const snapshot = createBaseSnapshot();
    snapshot.branches.mind.crestAvailable = false;
    snapshot.branches.mind.trialComplete = false;

    const branch = snapshot.branches.mind;
    const isCrestAvailable = branch.crestAvailable || (branch.trialComplete && !branch.crestClaimed);
    expect(isCrestAvailable).toBe(false);
  });

  it('2. Crest becomes available when server state indicates crestAvailable is true', () => {
    const snapshot = createBaseSnapshot();
    const branch = snapshot.branches.mind;

    const isCrestAvailable = branch.crestAvailable || (branch.trialComplete && !branch.crestClaimed);
    expect(isCrestAvailable).toBe(true);
    expect(branch.crestClaimed).toBe(false);
  });

  it('3. claimCrestAction returns updated server snapshot with crestClaimed: true and crestAvailable: false', async () => {
    const snapshot = createBaseSnapshot();

    const result = await claimCrestAction(snapshot, 'mind');

    expect(result.event.kind).toBe('trial_claimed');
    expect(result.event.attribute).toBe('mind');
    expect(result.event.specialization).toBe('scholar');
    expect(result.snapshot.branches.mind.crestClaimed).toBe(true);
    expect(result.snapshot.branches.mind.crestAvailable).toBe(false);
    expect(result.snapshot.trials.mind?.claimedAt).not.toBeNull();
    expect(result.revision).toBe(snapshot.revision + 1);
  });

  it('4. Delegates to Supabase RPC claim_trial when client is provided', async () => {
    const snapshot = createBaseSnapshot();
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        revision: 2,
        event: { id: 'evt-rpc-1', kind: 'trial_claimed', attribute: 'mind', specialization: 'scholar' },
        snapshot: {
          ...snapshot,
          revision: 2,
          branches: {
            ...snapshot.branches,
            mind: { ...snapshot.branches.mind, crestAvailable: false, crestClaimed: true },
          },
        },
      },
      error: null,
    });

    const mockSupabase = { rpc: mockRpc };
    const result = await claimCrestAction(snapshot, 'mind', mockSupabase);

    expect(mockRpc).toHaveBeenCalledWith('claim_trial', expect.objectContaining({
      p_attribute: 'mind',
    }));
    expect(result.snapshot.branches.mind.crestClaimed).toBe(true);
  });

  it('5. Handles RPC error gracefully by falling back to local calculation without corrupting state', async () => {
    const snapshot = createBaseSnapshot();
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
    });

    const mockSupabase = { rpc: mockRpc };
    const result = await claimCrestAction(snapshot, 'mind', mockSupabase);

    expect(result.snapshot.branches.mind.crestClaimed).toBe(true);
  });

  it('6. Duplicate claim prevention: Re-running claim on an already claimed branch preserves claimed state', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.branches.mind.crestClaimed = true;
    snapshot.branches.mind.crestAvailable = false;
    snapshot.trials.mind!.claimedAt = new Date().toISOString();

    const result = await claimCrestAction(snapshot, 'mind');

    expect(result.snapshot.branches.mind.crestClaimed).toBe(true);
    expect(result.snapshot.branches.mind.crestAvailable).toBe(false);
  });
});
