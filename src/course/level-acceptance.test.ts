import { expect, it } from 'vitest';
import { frozenLevelHash } from './accepted-freeze';
import { levelAcceptance, type AcceptanceRecord } from './level-acceptance';
import { rainSelfStop } from '../levels/lab/rs10-rain-self-stop';

const ai: AcceptanceRecord = {
  levelId: rainSelfStop.id, hash: frozenLevelHash(rainSelfStop), reviewer: 'ai',
  verdict: 'passed', evidence: 'test-only AI report',
};

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
