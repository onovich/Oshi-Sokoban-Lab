import { expect, it } from 'vitest';
import { frozenLevelHash } from './accepted-freeze';
import { levelAcceptance, type AcceptanceRecord } from './level-acceptance';
import { rainSelfStop } from '../levels/lab/rs10-rain-self-stop';
import { bc1OffsetBank } from '../levels/lab/bc1-offset-bank';
import { ba3TwoStageParking } from '../levels/lab/ba3-two-stage-parking';
import { bd2ShiftedEntry } from '../levels/lab/bd2-shifted-entry';
import { bd3ControlledEntry } from '../levels/lab/bd3-controlled-entry';
import { be1OriginLoan } from '../levels/lab/be1-origin-loan';
import { bb2GoalPermission } from '../levels/lab/bb2-goal-permission';

const ai: AcceptanceRecord = {
  levelId: rainSelfStop.id, hash: frozenLevelHash(rainSelfStop), reviewer: 'ai',
  verdict: 'passed', evidence: 'test-only AI report',
};

it('records actual Gate and Spike playtests as intermediate approval only', () => {
  expect(levelAcceptance(bd3ControlledEntry).state).toBe('ai-passed');
  expect(levelAcceptance(be1OriginLoan).state).toBe('ai-passed');
});

it('preserves the original Goal review and follows its completed visual repair check', () => {
  expect(levelAcceptance(bb2GoalPermission)).toMatchObject({
    state: 'ai-passed', evidence: 'docs/playtests/2026-09-30-goal-overlap.md',
  });
});

it('keeps AI acceptance intermediate and lets author rejection override a later AI pass', () => {
  expect(levelAcceptance(rainSelfStop, [ai]).state).toBe('ai-passed');
  const author: AcceptanceRecord = { ...ai, reviewer: 'author', verdict: 'changes-requested', evidence: 'author rejection' };
  expect(levelAcceptance(rainSelfStop, [author, ai])).toMatchObject({ state: 'author-changes', evidence: 'author rejection' });
  expect(levelAcceptance(rainSelfStop, [ai, author, { ...author, verdict: 'passed' }]).state).toBe('author-passed');
});

it('does not transfer acceptance to a revised puzzle or another stable id', () => {
  const changed = { ...rainSelfStop, board: { ...rainSelfStop.board, player: { x: 2, y: 1 } } };
  expect(levelAcceptance(changed, [ai]).state).toBe('outdated');
  expect(levelAcceptance({ ...rainSelfStop, id: 'new-level' }, [ai]).state).toBe('pending');
  expect(levelAcceptance({ ...rainSelfStop, board: { ...rainSelfStop.board, title: 'New title' } }, [ai]).state).toBe('ai-passed');
});

it('records the played rain candidate as AI-only, never author acceptance', () => {
  expect(levelAcceptance(bc1OffsetBank)).toMatchObject({
    state: 'ai-passed', evidence: 'docs/playtests/2026-09-29-ai-bc1.md',
  });
});

it('keeps the return puzzle under revision after the current-version visual review', () => {
  expect(levelAcceptance(ba3TwoStageParking)).toMatchObject({
    state: 'ai-changes', evidence: 'docs/playtests/2026-09-29-ai-ba3.md',
  });
});

it('records the frozen shifted-entry playtest as intermediate AI acceptance', () => {
  expect(levelAcceptance(bd2ShiftedEntry)).toMatchObject({
    state: 'ai-passed', evidence: 'docs/playtests/2026-09-29-ai-bd2.md',
  });
});
