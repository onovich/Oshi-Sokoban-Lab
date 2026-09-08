import { expect, it } from 'vitest';
import { createGame, move, isBlockSolved, undo, restart } from '../../engine/game-engine';
import { auditLevelMutations } from '../level-mutation-audit';
import { searchSpatialExperiment } from './spatial-experiment-search';
import { e04TeachingLevels } from './e04-teaching';

it('offers a smaller playable shared-space lesson with a necessary intermediate arrangement', () => {
  const lesson = e04TeachingLevels[0]!;
  expect(lesson.board.blocks).toHaveLength(2);
  const initial = createGame(lesson.board);
  const report = searchSpatialExperiment(initial);
  expect(report.status).toBe('solved');
  let state = initial;
  for (const direction of report.solution!) state = move(state, direction).state;
  expect(state.status).toBe('won');
  const bypass = searchSpatialExperiment(initial, {
    forbiddenConditions: lesson.theorem.proofConditions,
  });
  expect(bypass.status).toBe('proven-unsolved');
});

it.each([
  {index:0, route:'DDRDL'},
  {index:1, route:'DRRDDLL'},
])('lesson $index exposes premature completion; the isolated lesson has a player-only contrast', ({index,route}) => {
  const lesson=e04TeachingLevels[index]!;
  const initial=createGame(lesson.board);
  const replay=(start:typeof initial, actions=route) => {
    let state=start;
    for (const letter of actions) {
      const result=move(state, ({U:'up',D:'down',L:'left',R:'right'} as const)[letter as 'U'|'D'|'L'|'R']);
      expect(result.didMove).toBe(true);
      state=result.state;
    }
    return state;
  };
  const dead=replay(initial);
  expect(isBlockSolved(dead,dead.blocks.at(-1)!)).toBe(true);
  expect(searchSpatialExperiment(dead).status).toBe('proven-unsolved');
  expect(restart(dead)).toEqual(initial);
  expect(undo(dead).history.length).toBe(dead.history.length-1);
  if(index===1) {
    // The staged horizontal block adds another constraint: this is not the
    // same one-variable contrast as the isolated two-object lesson.
    const openWall={...lesson.board,walls:lesson.board.walls.filter(p=>p.x!==0||p.y!==2)};
    expect(searchSpatialExperiment(replay(createGame(openWall))).status).toBe('proven-unsolved');
    return;
  }
  const contrast={...lesson.board,walls:lesson.board.walls.filter(p=>p.x!==0||p.y!==2)};
  const opened=replay(createGame(contrast));
  expect(isBlockSolved(opened,opened.blocks.at(-1)!)).toBe(true);
  const result=searchSpatialExperiment(opened, {maximumStates:200000, forbiddenTransition:(_before,next)=>
    next.state.blocks.some(b=>b.shape.some(p=>b.position.x+p.x===0&&b.position.y+p.y===2)) ||
    next.events.some(e=>e.type==='block-pushed'&&e.entityId.endsWith('-c')),
  });
  expect(result.status).toBe('solved');
  let state=opened;
  for (const direction of result.solution!) state=move(state,direction).state;
  expect(state.status).toBe('won');
});

it.each([0,1])('lesson %i has no unaccounted mutation results', index => {
  const report=auditLevelMutations(e04TeachingLevels[index]!,200000);
  expect(report.some(r=>['invalid','inconclusive'].includes(r.effect))).toBe(false);
  expect(report.filter(r=>r.classification==='redundant')).toEqual([]);
},60000);

it('adds one interacting shape while leaving the small block already in a recoverable staging position', () => {
  const lesson = e04TeachingLevels[1]!;
  expect(lesson).toBeDefined();
  const initial = createGame(lesson.board);
  const report = searchSpatialExperiment(initial, {maximumStates:200000});
  expect(report.status).toBe('solved');
  let state=initial;
  for (const direction of report.solution!) state=move(state,direction).state;
  expect(state.status).toBe('won');
  expect(searchSpatialExperiment(initial, {
    maximumStates:200000, forbiddenConditions:lesson.theorem.proofConditions,
  }).status).toBe('proven-unsolved');
});
