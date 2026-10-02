import { expect, it } from 'vitest';
import { octoberBatch } from '../levels/lab/october-batch';
import { levelAcceptance } from './level-acceptance';

it('records independently played October wins as intermediate approval, not author decisions', () => {
  for (const id of ['lab-oct-m02', 'lab-oct-m03', 'lab-oct-g01', 'lab-oct-g02']) {
    expect(levelAcceptance(octoberBatch.find(level => level.id === id)!).state).toBe('ai-passed');
  }
});
it('does not turn incomplete attempts or a visual-only review into puzzle acceptance', () => {
  for (const id of ['lab-oct-m01', 'lab-oct-g03', 'lab-oct-g06']) {
    expect(levelAcceptance(octoberBatch.find(level => level.id === id)!).state).toBe('pending');
  }
});
