import { it, expect } from 'vitest';
import { createGame, move, isBlockSolved, undo, restart } from '../../engine/game-engine';
import { evaluateProofConditions } from '../../course/proof-evaluator';
import { auditLevelMutations } from '../level-mutation-audit';
import type { GameState } from '../../engine/types';
import { e04SharedCourt } from './e04-shared-staging';
import { searchSpatialExperiment } from './spatial-experiment-search';

it('requires preparing another task before the single block can finish', () => {
  const initial = createGame(e04SharedCourt.board);
  expect(initial.blocks).toHaveLength(3);
  const report = searchSpatialExperiment(initial, { forbiddenTransition: (before, result) =>
    !isBlockSolved(before, before.blocks.at(-1)!) && result.events.some(e => e.type === 'block-pushed' && e.entityId !== before.blocks.at(-1)!.id),
  });
  expect(report.status).toBe('proven-unsolved');
  const solution = searchSpatialExperiment(initial, { maximumStates: 200000 });
  expect(solution.status).toBe('solved');
  let state = initial;
  const batches = solution.solution!.map(d => {
    const r = move(state,d);
    expect(r.didMove).toBe(true);
    state=r.state;
    return { events:r.events, pushes:r.events.filter(e=>e.type==='block-pushed').length };
  });
  expect(state.status).toBe('won');
  expect(evaluateProofConditions(e04SharedCourt.theorem.proofConditions,batches).every(p=>p.satisfied)).toBe(true);
  expect(searchSpatialExperiment(initial,{ maximumStates:200000, forbiddenConditions:e04SharedCourt.theorem.proofConditions }).status).toBe('proven-unsolved');
});

function play(state: GameState, route: string) {
  const directions = { U:'up', R:'right', D:'down', L:'left' } as const;
  for (const letter of route) {
    const result = move(state,directions[letter as keyof typeof directions]);
    expect(result.didMove).toBe(true);
    state=result.state;
  }
  return state;
}

it.each([
  { route:'URRRDDL', last:'up' as const, entity:'b' },
  { route:'URRRDDDURDDL', last:'left' as const, entity:'c' },
])('the $entity-first plan makes real progress but commits a deadlock', ({route,last,entity}) => {
  const initial = createGame(e04SharedCourt.board);
  const before = play(initial,route);
  const finish = move(before,last);
  expect(finish.didMove).toBe(true);
  const block = finish.state.blocks.find(b=>b.id.endsWith(`-${entity}`))!;
  expect(isBlockSolved(finish.state,block)).toBe(true);
  expect(finish.state.blocks.filter(b=>b.id!==block.id).map(b=>b.position))
    .toEqual(initial.blocks.filter(b=>b.id!==block.id).map(b=>b.position));
  expect(finish.state.status).toBe('playing');
  expect(searchSpatialExperiment(finish.state,{maximumStates:200000}).status).toBe('proven-unsolved');
  expect(undo(finish.state)).toEqual(before);
  expect(restart(finish.state)).toEqual(initial);
  const beforeCommitment = entity === 'c' ? undo(before) : before;
  if (entity === 'c') expect(searchSpatialExperiment(before,{maximumStates:200000}).status).toBe('proven-unsolved');
  expect(searchSpatialExperiment(beforeCommitment,{maximumStates:200000}).status).toBe('solved');
});

it('an independent player push side makes the identical C-first prefix viable', () => {
  const board = { ...e04SharedCourt.board, walls:e04SharedCourt.board.walls.filter(p=>p.x!==0||p.y!==2) };
  const staged = play(createGame(board),'URRRDDDURDDLL');
  const report = searchSpatialExperiment(staged,{maximumStates:200000, forbiddenTransition:(_before,result)=>
    result.state.blocks.some(b=>b.shape.some(p=>b.position.x+p.x===0&&b.position.y+p.y===2)),
  });
  expect(report.status).toBe('solved');
  let state = staged;
  for (const direction of report.solution!) state=move(state,direction).state;
  expect(state.status).toBe('won');
  expect(state.blocks.find(b=>b.id.endsWith('-c'))!.position).toEqual({x:1,y:4});
});

it('shows every initial Goal without covering it with an object or player', () => {
  const board=e04SharedCourt.board;
  const occupied=[board.player,...board.blocks.flatMap(b=>b.shape.map(p=>({x:b.position.x+p.x,y:b.position.y+p.y})))];
  for(const goal of board.terrainGoals) expect(occupied).not.toContainEqual(goal);
});

it('has no unexplained deletion or wall-sealing mutations', () => {
  const report = auditLevelMutations(e04SharedCourt,200000);
  expect(report).toHaveLength(20);
  expect(report.filter(r=>r.classification==='redundant')).toEqual([]);
  expect(report.some(r=>['invalid','inconclusive'].includes(r.effect))).toBe(false);
},60000);
