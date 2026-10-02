import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { createGame } from '../engine/game-engine';
import type { LevelDefinition } from '../engine/types';
import { Board } from './Board';

const c = (x: number, y: number) => ({ x, y });
const gate = (id: string, nextGateId: string, x: number) => ({ id, nextGateId, position: c(x, 0), shape: [c(0, 0)] });
const board: LevelDefinition = {
  id: 'pair-labels', title: 'Pair fixture', width: 5, height: 3, weather: 'clear', player: c(0, 2),
  walls: [], terrainGoals: [c(4, 2)], terrainSpikes: [], goals: [], spikes: [], paths: [],
  blocks: [{ id: 'box', position: c(2, 2), shape: [c(0, 0)], number: 0, isFake: false }],
  // Interleaved ordering deliberately prevents treating adjacent array items as pairs.
  gates: [gate('a', 'c', 0), gate('b', 'd', 1), gate('c', 'a', 2), gate('d', 'b', 3)],
};
it('marks actual reciprocal pairs visually and in accessible cells, independent of array adjacency', () => {
  const state = createGame(board);
  const { container, getByRole, rerender } = render(<Board state={state} />);
  const labels = () => [...container.querySelectorAll('.board__gate-pair')].map(el => [el.parentElement?.getAttribute('data-entity-id'), el.textContent]);
  expect(labels()).toEqual([['a', 'A'], ['b', 'B'], ['c', 'A'], ['d', 'B']]);
  expect(getByRole('gridcell', { name: 'Cell 1, 1: Gate A' })).toBeTruthy();
  rerender(<Board state={{ ...state, gates: state.gates.map(g => ({ ...g, position: { ...g.position, y: 1 } })) }} />);
  expect(labels()).toEqual([['a', 'A'], ['b', 'B'], ['c', 'A'], ['d', 'B']]);
  expect(getByRole('gridcell', { name: 'Cell 3, 2: Gate A' })).toBeTruthy();
});
it('keeps established single-pair boards unchanged', () => {
  const { container, getByRole } = render(<Board state={createGame({ ...board, gates: [board.gates[0]!, board.gates[2]!] })} />);
  expect(container.querySelector('.board__gate-pair')).toBeNull();
  expect(getByRole('gridcell', { name: 'Cell 1, 1: Gate' })).toBeTruthy();
});
