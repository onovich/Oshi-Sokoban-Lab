import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createGame, move } from '../engine/game-engine';
import { demoLevels } from '../levels/demo-levels';
import { Board } from './Board';

function gameFor(id: string) {
  const level = demoLevels.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Missing demo level: ${id}`);
  return createGame(level);
}

describe('Board glyph system', () => {
  it('renders Oshi projection marks instead of Unicode symbols or a visible grid', () => {
    const { container } = render(<Board state={gameFor('rain-06')} />);

    expect(container.querySelector('[data-visual-language="oshi-projection"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="player"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="block"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="terrain-goal"]')).toBeTruthy();
    expect(container.querySelector('[data-terrain="wall"]')).toBeTruthy();
    expect(container.querySelector('.board__weather-film')).toBeTruthy();
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
    expect(container.textContent).not.toContain('●');
    expect(container.textContent).not.toContain('■');
  });

  it('uses flat source-style entities instead of the previous decorative arrows, badges, and fake cutout', () => {
    const numbered = render(<Board state={gameFor('match-03')} />);
    const player = numbered.container.querySelector('[data-glyph="player"]');
    const block = numbered.container.querySelector('[data-glyph="block"]');
    const goal = numbered.container.querySelector('[data-glyph="goal"]');

    expect(player?.querySelector('.game-glyph__flat-square')).toBeTruthy();
    expect(player?.querySelector('.game-glyph__cutout')).toBeNull();
    expect(block?.querySelector('[data-number-style="centered"]')?.textContent).toBe('2');
    expect(goal?.querySelector('[data-number-style="centered"]')?.textContent).toBe('2');
    expect(block?.textContent).not.toContain('B2');
    expect(goal?.textContent).not.toContain('G2');

    const fake = render(<Board state={gameFor('fake-04')} />).container.querySelector('[data-glyph="fake-block"]');
    expect(fake?.querySelector('.game-glyph__fake-cut')).toBeNull();
  });

  it('draws the runtime Path as a thin red line behind a moving Spike', () => {
    const { container } = render(<Board state={gameFor('path-loop-10')} />);

    expect(container.querySelector('[data-path="loop-path"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="moving-spike"]')).toBeTruthy();
  });

  it('only gives a real Block the Bloom state after it covers a matching Goal', () => {
    const initial = gameFor('push-01');
    const solved = move(move(initial, 'right').state, 'right').state;

    expect(render(<Board state={initial} />).container.querySelector('[data-glyph="block"]')?.getAttribute('data-state')).toBeNull();
    expect(render(<Board state={solved} />).container.querySelector('[data-glyph="block"]')?.getAttribute('data-state')).toBe('complete');
  });

  it('uses a paired blue/orange portal treatment for a Gate lesson', () => {
    const { container } = render(<Board state={gameFor('gate-08')} />);

    expect(container.querySelector('[data-glyph="gate-blue"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="gate-orange"]')).toBeTruthy();
    expect(container.querySelectorAll('.game-glyph__portal-energy')).toHaveLength(2);
  });

  it('lays the player, Blocks, and Goals on one shared grid unit', () => {
    const { container } = render(<Board state={gameFor('match-03')} />);

    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-grid-cell')).toBe('0:1');
    expect(container.querySelector('[data-entity-id="block-two"]')?.getAttribute('data-grid-cell')).toBe('1:1');
    expect(container.querySelector('[data-entity-id="goal-two"]')?.getAttribute('data-grid-cell')).toBe('3:1');
    expect(container.querySelectorAll('[data-grid-unit="1"]')).toHaveLength(3);
  });

  it('tweens each moved entity from its prior logical grid cell', () => {
    const initial = gameFor('push-01');
    const afterPush = move(initial, 'right').state;
    const { container, rerender } = render(<Board state={initial} />);

    rerender(<Board state={afterPush} />);

    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-motion')).toBe('moving');
    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-motion-from')).toBe('0:1');
    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-motion-to')).toBe('1:1');
    expect(container.querySelector('[data-entity-id="push-block"]')?.getAttribute('data-motion-from')).toBe('1:1');
    expect(container.querySelector('[data-entity-id="push-block"]')?.getAttribute('data-motion-to')).toBe('2:1');
  });

  it('does not make the whole board focusable when global keyboard controls are active', () => {
    const { container } = render(<Board state={gameFor('push-01')} />);

    expect(container.querySelector('[role="grid"]')?.getAttribute('tabindex')).toBeNull();
  });
});
