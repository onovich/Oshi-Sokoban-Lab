import { expect, it } from 'vitest';
import { octoberBatch } from '../levels/lab/october-batch';
import { levelAcceptance } from './level-acceptance';

it('records independently played October wins as intermediate approval, not author decisions', () => {
  for (const id of ['lab-oct-m02', 'lab-oct-m03', 'lab-oct-g01', 'lab-oct-g02', 'lab-oct-m04', 'lab-oct-s01', 'lab-oct-s02', 'lab-oct-s03', 'lab-oct-s04']) {
    expect(levelAcceptance(octoberBatch.find(level => level.id === id)!).state).toBe('ai-passed');
  }
});
it('does not turn incomplete attempts or a visual-only review into puzzle acceptance', () => {
  for (const id of ['lab-oct-m01', 'lab-oct-g03', 'lab-oct-g06']) {
    expect(levelAcceptance(octoberBatch.find(level => level.id === id)!).state).toBe('pending');
  }
});
it('records independently transferred movable-goal understanding without upgrading unsolved allocation levels', () => {
  for (const id of ['lab-oct-m07', 'lab-oct-m09']) expect(levelAcceptance(octoberBatch.find(l => l.id === id)!).state).toBe('ai-passed');
  for (const id of ['lab-oct-m06', 'lab-oct-m08']) expect(levelAcceptance(octoberBatch.find(l => l.id === id)!).state).toBe('pending');
});
it('records observed reset transfers but leaves the unsolved Gate reset case pending', () => {
  for (const id of ['s07', 's09', 's06', 's10', 'm10']) expect(levelAcceptance(octoberBatch.find(l => l.id === `lab-oct-${id}`)!).state).toBe('ai-passed');
  expect(levelAcceptance(octoberBatch.find(l => l.id === 'lab-oct-s08')!).state).toBe('pending');
});
it('accepts the observed two-task Gate win and never substitutes visual review or solver proof for play', () => {
  expect(levelAcceptance(octoberBatch.find(l => l.id === 'lab-oct-g08')!).state).toBe('ai-passed');
  expect(octoberBatch.filter(l => levelAcceptance(l).state === 'ai-passed')).toHaveLength(17);
  expect(octoberBatch.filter(l => levelAcceptance(l).state === 'pending')).toHaveLength(13);
  expect(octoberBatch.some(l => levelAcceptance(l).state.startsWith('author'))).toBe(false);
});
