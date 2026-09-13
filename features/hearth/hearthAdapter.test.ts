import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { GameSnapshot, MutationResult } from '../../game/contracts';
import {
  completeQuestAction,
  createQuestAction,
  updateQuestAction,
  updateQuestNotesAction,
  softDeleteQuestAction,
  fetchGameSnapshotAction,
} from './hearthAdapter';
import { DEMO_SNAPSHOT } from '../../game/fixtures/snapshot';

describe('Hearth Adapters — Authoritative RPC Dispatch & Contract Verification', () => {
  it('runs fixture preview simulation when supabaseClient is omitted', async () => {
    const res = await completeQuestAction(DEMO_SNAPSHOT, 'q-fixture-1', null);
    assert.equal(res.event.kind, 'quest_completed');
    assert.equal(res.event.xpAwarded, 20);
    assert.equal(res.snapshot.totalXp, 110);
    assert.equal(res.snapshot.emberState, 'kindled');
  });

  it('completeQuestAction dispatches to complete_quest RPC with expected parameters', async () => {
    let capturedFn: string | null = null;
    let capturedParams: any = null;

    const mockResult: MutationResult = {
      revision: 13,
      event: {
        id: 'evt-1',
        kind: 'quest_completed',
        xpAwarded: 20,
        sparksAwarded: 4,
      },
      snapshot: {
        ...DEMO_SNAPSHOT,
        revision: 13,
        totalXp: 110,
      },
    };

    const mockClient = {
      rpc: async (fn: string, params: any) => {
        capturedFn = fn;
        capturedParams = params;
        return { data: mockResult, error: null };
      },
    };

    const res = await completeQuestAction(
      DEMO_SNAPSHOT,
      'q-fixture-1',
      mockClient,
      'a0000000-0000-0000-0000-000000000001'
    );

    assert.equal(capturedFn, 'complete_quest');
    assert.equal(capturedParams.p_quest_id, 'q-fixture-1');
    assert.equal(capturedParams.p_expected_occurrence, '2026-09-12');
    assert.equal(capturedParams.p_request_id, 'a0000000-0000-0000-0000-000000000001');
    assert.equal(res.revision, 13);
  });

  it('completeQuestAction surfaces database errors without pretending success', async () => {
    const mockClient = {
      rpc: async () => ({
        data: null,
        error: { message: 'quest already completed for this occurrence', code: 'P0008' },
      }),
    };

    await assert.rejects(
      async () => {
        await completeQuestAction(DEMO_SNAPSHOT, 'q-fixture-1', mockClient);
      },
      {
        message: /complete_quest failed: quest already completed for this occurrence/,
      }
    );
  });

  it('createQuestAction dispatches to create_quest RPC with canonical fields', async () => {
    let capturedFn: string | null = null;
    let capturedParams: any = null;

    const mockClient = {
      rpc: async (fn: string, params: any) => {
        capturedFn = fn;
        capturedParams = params;
        return {
          data: {
            revision: 14,
            event: { id: 'evt-2', kind: 'quest_created', questId: 'q-new-1' },
            snapshot: DEMO_SNAPSHOT,
          },
          error: null,
        };
      },
    };

    const res = await createQuestAction(
      DEMO_SNAPSHOT,
      {
        title: 'Morning stretch',
        attribute: 'body',
        effort: 'quick',
        cadence: 'daily',
      },
      mockClient,
      'a0000000-0000-0000-0000-000000000002'
    );

    assert.equal(capturedFn, 'create_quest');
    assert.equal(capturedParams.p_title, 'Morning stretch');
    assert.equal(capturedParams.p_attribute, 'body');
    assert.equal(capturedParams.p_effort, 'quick');
    assert.equal(capturedParams.p_cadence, 'daily');
    assert.equal(res.event.kind, 'quest_created');
  });

  it('updateQuestAction dispatches to update_quest RPC with expectedVersion', async () => {
    let capturedFn: string | null = null;
    let capturedParams: any = null;

    const mockClient = {
      rpc: async (fn: string, params: any) => {
        capturedFn = fn;
        capturedParams = params;
        return {
          data: {
            revision: 15,
            event: { id: 'evt-3', kind: 'quest_updated', questId: 'q-fixture-1', version: 2 },
            snapshot: DEMO_SNAPSHOT,
          },
          error: null,
        };
      },
    };

    const res = await updateQuestAction(
      DEMO_SNAPSHOT,
      'q-fixture-1',
      {
        expectedVersion: 1,
        title: 'Advanced Java recursion practice',
        attribute: 'mind',
        effort: 'deep',
        cadence: 'daily',
      },
      mockClient,
      'a0000000-0000-0000-0000-000000000003'
    );

    assert.equal(capturedFn, 'update_quest');
    assert.equal(capturedParams.p_quest_id, 'q-fixture-1');
    assert.equal(capturedParams.p_expected_version, 1);
    assert.equal(capturedParams.p_title, 'Advanced Java recursion practice');
    assert.equal(res.event.kind, 'quest_updated');
  });

  it('softDeleteQuestAction dispatches to soft_delete_quest RPC', async () => {
    let capturedFn: string | null = null;
    let capturedParams: any = null;

    const mockClient = {
      rpc: async (fn: string, params: any) => {
        capturedFn = fn;
        capturedParams = params;
        return {
          data: {
            revision: 16,
            event: { id: 'evt-4', kind: 'quest_deleted', questId: 'q-fixture-1' },
            snapshot: DEMO_SNAPSHOT,
          },
          error: null,
        };
      },
    };

    const res = await softDeleteQuestAction(
      DEMO_SNAPSHOT,
      'q-fixture-1',
      mockClient,
      'a0000000-0000-0000-0000-000000000004'
    );

    assert.equal(capturedFn, 'soft_delete_quest');
    assert.equal(capturedParams.p_quest_id, 'q-fixture-1');
    assert.equal(res.event.kind, 'quest_deleted');
  });

  it('fetchGameSnapshotAction dispatches to get_game_snapshot RPC', async () => {
    let capturedFn: string | null = null;

    const mockClient = {
      rpc: async (fn: string) => {
        capturedFn = fn;
        return { data: DEMO_SNAPSHOT, error: null };
      },
    };

    const res = await fetchGameSnapshotAction(mockClient);

    assert.equal(capturedFn, 'get_game_snapshot');
    assert.equal(res.userId, 'fixture-user-id');
  });

  describe('Quest Notes Hardening & Snapshot Immutability', () => {
    it('rejects notes exceeding 1000 characters in updateQuestNotesAction', async () => {
      const longNote = 'X'.repeat(1001);
      await assert.rejects(
        () => updateQuestNotesAction(DEMO_SNAPSHOT, 'q-fixture-1', longNote),
        /cannot exceed 1000 characters/
      );
    });

    it('persists quest note snapshot upon completion and preserves it immutably across subsequent note edits', async () => {
      // 1. Initial quest with note
      const initialQuest = {
        ...DEMO_SNAPSHOT.quests![0],
        id: 'q-immutable-test',
        notes: 'Original intention before sealing.',
        completedForCurrentOccurrence: false,
      };

      const testSnapshot: GameSnapshot = {
        ...DEMO_SNAPSHOT,
        quests: [initialQuest],
      };

      // 2. Complete quest -> creates completion snapshot with original notes
      const completionResult = await completeQuestAction(testSnapshot, 'q-immutable-test', null);
      assert.equal(completionResult.event.questNotesSnapshot, 'Original intention before sealing.');

      // 3. Edit quest notes afterward
      const editResult = await updateQuestNotesAction(
        completionResult.snapshot,
        'q-immutable-test',
        'Updated note after practice was completed.'
      );

      // Quest now has updated note
      assert.equal(editResult.quest.notes, 'Updated note after practice was completed.');

      // Historical completion event / snapshot remains strictly immutable!
      assert.equal(completionResult.event.questNotesSnapshot, 'Original intention before sealing.');
    });
  });
});
