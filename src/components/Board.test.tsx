import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createGame, move } from '../engine/game-engine';
import type { DomainEvent, LevelDefinition } from '../engine/types';
import { spikeResetLevels } from '../levels/families/spike-reset-levels';
import { Board } from './Board';

const oneCell = [{ x: 0, y: 0 }] as const;

const baseLevel: LevelDefinition = {
  id: 'board-fixture',
  title: 'Board fixture',
  width: 5,
  height: 3,
  weather: 'clear',
  player: { x: 0, y: 1 },
  walls: [],
  terrainGoals: [{ x: 3, y: 1 }],
  terrainSpikes: [],
  blocks: [{ id: 'board-block', position: { x: 1, y: 1 }, shape: oneCell, number: 0, isFake: false }],
  goals: [],
  gates: [],
  spikes: [],
  paths: [],
};

const rainLevel: LevelDefinition = {
  ...baseLevel,
  id: 'board-rain',
  weather: 'rain',
  walls: [{ x: 4, y: 1 }],
  blocks: [{ id: 'rain-block', position: { x: 2, y: 1 }, shape: oneCell, number: 0, isFake: false }],
};

const numberedLevel: LevelDefinition = {
  ...baseLevel,
  id: 'board-numbered',
  terrainGoals: [],
  blocks: [{ id: 'block-two', position: { x: 1, y: 1 }, shape: oneCell, number: 2, isFake: false }],
  goals: [{ id: 'goal-two', position: { x: 3, y: 1 }, shape: oneCell, number: 2, movable: false }],
};

const fakeLevel: LevelDefinition = {
  ...baseLevel,
  id: 'board-fake',
  blocks: [{ id: 'fake-block', position: { x: 1, y: 1 }, shape: oneCell, number: 0, isFake: true }],
};

const pathLevel: LevelDefinition = {
  ...baseLevel,
  id: 'board-path',
  terrainGoals: [],
  blocks: [{ id: 'path-block', position: { x: 4, y: 2 }, shape: oneCell, number: 0, isFake: false }],
  spikes: [{ id: 'loop-spike', position: { x: 1, y: 1 }, shape: oneCell }],
  paths: [
    {
      id: 'loop-path',
      travelerId: 'loop-spike',
      nodes: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
      loop: 'loop',
    },
  ],
};

const gateLevel: LevelDefinition = {
  ...baseLevel,
  id: 'board-gate',
  player: { x: 0, y: 1 },
  walls: [{ x: 0, y: 0 }, { x: 0, y: 2 }],
  terrainGoals: [{ x: 2, y: 1 }],
  blocks: [{ id: 'gate-block', position: { x: 3, y: 1 }, shape: oneCell, number: 0, isFake: false }],
  gates: [
    { id: 'entry-gate', position: { x: 1, y: 1 }, shape: oneCell, nextGateId: 'exit-gate' },
    { id: 'exit-gate', position: { x: 3, y: 0 }, shape: oneCell, nextGateId: 'entry-gate' },
  ],
};

const sharedResetPresentationLevel: LevelDefinition = {
  ...baseLevel,
  id: 'board-shared-reset-presentation',
  width: 7,
  terrainGoals: [],
  terrainSpikes: [{ x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }],
  blocks: [{ id: 'reset-fake', position: { x: 0, y: 0 }, shape: oneCell, number: 0, isFake: true }],
  goals: [{ id: 'reset-goal', position: { x: 1, y: 0 }, shape: oneCell, number: 0, movable: true }],
  gates: [
    { id: 'reset-gate', position: { x: 2, y: 0 }, shape: oneCell, nextGateId: 'other-gate' },
    { id: 'other-gate', position: { x: 3, y: 0 }, shape: oneCell, nextGateId: 'reset-gate' },
  ],
};

const sharedResetEvents: readonly DomainEvent[] = [
  {
    type: 'object-reset', entityType: 'block', entityId: 'reset-fake', reason: 'spike',
    from: { x: 4, y: 0 }, to: { x: 0, y: 0 }, contactCells: [{ x: 4, y: 0 }],
  },
  {
    type: 'object-reset', entityType: 'goal', entityId: 'reset-goal', reason: 'spike',
    from: { x: 5, y: 0 }, to: { x: 1, y: 0 }, contactCells: [{ x: 5, y: 0 }],
  },
  {
    type: 'object-reset', entityType: 'gate', entityId: 'reset-gate', reason: 'spike',
    from: { x: 6, y: 0 }, to: { x: 2, y: 0 }, contactCells: [{ x: 6, y: 0 }],
  },
];

function gameFor(level: LevelDefinition) {
  return createGame(level);
}

describe('Board glyph system', () => {
  it('renders Oshi projection marks instead of Unicode symbols or a visible grid', () => {
    const { container } = render(<Board state={gameFor(rainLevel)} />);

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
    const numbered = render(<Board state={gameFor(numberedLevel)} />);
    const player = numbered.container.querySelector('[data-glyph="player"]');
    const block = numbered.container.querySelector('[data-glyph="block"]');
    const goal = numbered.container.querySelector('[data-glyph="goal"]');

    expect(player?.querySelector('.game-glyph__flat-square')).toBeTruthy();
    expect(player?.querySelector('.game-glyph__cutout')).toBeNull();
    expect(block?.querySelector('[data-number-style="centered"]')?.textContent).toBe('2');
    expect(goal?.querySelector('[data-number-style="centered"]')?.textContent).toBe('2');
    expect(block?.textContent).not.toContain('B2');
    expect(goal?.textContent).not.toContain('G2');

    const fake = render(<Board state={gameFor(fakeLevel)} />).container.querySelector('[data-glyph="fake-block"]');
    expect(fake?.querySelector('.game-glyph__fake-cut')).toBeNull();
  });

  it('draws the runtime Path as a thin red line behind a moving Spike', () => {
    const { container } = render(<Board state={gameFor(pathLevel)} />);

    expect(container.querySelector('[data-path="loop-path"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="moving-spike"]')).toBeTruthy();
  });

  it('only gives a real Block the Bloom state after it covers a matching Goal', () => {
    const initial = gameFor(baseLevel);
    const solved = move(move(initial, 'right').state, 'right').state;

    expect(render(<Board state={initial} />).container.querySelector('[data-glyph="block"]')?.getAttribute('data-state')).toBeNull();
    expect(render(<Board state={solved} />).container.querySelector('[data-glyph="block"]')?.getAttribute('data-state')).toBe('complete');
  });

  it('uses a paired blue/orange portal treatment for a Gate lesson', () => {
    const { container } = render(<Board state={gameFor(gateLevel)} />);

    expect(container.querySelector('[data-glyph="gate-blue"]')).toBeTruthy();
    expect(container.querySelector('[data-glyph="gate-orange"]')).toBeTruthy();
    expect(container.querySelectorAll('.game-glyph__portal-energy')).toHaveLength(2);
  });

  it('projects the source Gate shader over FullRect geometry without consuming texture alpha', () => {
    const { container } = render(<Board state={gameFor(gateLevel)} />);
    const portal = container.querySelector('[data-glyph="gate-blue"]');
    const energy = portal?.querySelector('.game-glyph__portal-energy');
    const canvas = portal?.querySelector('canvas');

    expect(portal?.getAttribute('data-portal-texture')).toBe('spr-gate-001');
    expect(portal?.getAttribute('data-portal-mask-alpha-consumed')).toBe('false');
    expect(portal?.getAttribute('data-portal-mask')).toBeNull();
    expect(portal?.querySelector('[data-portal-shader="unity-14-twirl-voronoi"]')).toBeTruthy();
    expect(energy?.getAttribute('data-portal-geometry')).toBe('full-rect');
    expect(energy?.getAttribute('data-portal-texture-sample')).toBe('rgba');
    expect(energy?.getAttribute('data-portal-alpha-source')).toBe('product-r');
    expect(energy?.getAttribute('data-portal-mask-layer')).toBeNull();
    expect(energy?.getAttribute('data-portal-parameters')).toBe('speed-0.5 strength-8 density-2 brightness-2');
    expect(energy?.getAttribute('data-portal-postprocess')).toBe('bloom-threshold-1 intensity-0.3 high-quality');
    expect(canvas?.getAttribute('data-portal-renderer')).toBe('webgl2');
    expect(canvas?.getAttribute('data-portal-animation')).toBe('continuous');
    expect(canvas?.getAttribute('data-portal-color-conversion')).toBe('unity-linear-to-srgb');
    expect(canvas?.getAttribute('data-portal-time-conversion')).toBe('milliseconds-to-seconds');
    expect(portal?.querySelector('.game-glyph__portal-voronoi')).toBeNull();
    expect(portal?.querySelector('.game-glyph__portal-vortex')).toBeNull();
  });

  it('lays the player, Blocks, and Goals on one shared grid unit', () => {
    const { container } = render(<Board state={gameFor(numberedLevel)} />);

    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-grid-cell')).toBe('0:1');
    expect(container.querySelector('[data-entity-id="block-two"]')?.getAttribute('data-grid-cell')).toBe('1:1');
    expect(container.querySelector('[data-entity-id="goal-two"]')?.getAttribute('data-grid-cell')).toBe('3:1');
    expect(container.querySelectorAll('[data-grid-unit="1"]')).toHaveLength(3);
  });

  it('renders solid moving pieces to fill their complete grid cells', () => {
    const { container } = render(<Board state={gameFor(baseLevel)} />);

    for (const entityId of ['role', 'board-block']) {
      const entity = container.querySelector(`[data-entity-id="${entityId}"]`);
      const glyph = entity?.querySelector('[data-glyph]');
      const square = glyph?.querySelector('.game-glyph__flat-square');

      expect(entity?.getAttribute('data-grid-unit')).toBe('1');
      expect(glyph?.getAttribute('data-cell-footprint')).toBe('full');
      expect(square?.getAttribute('x')).toBe('0');
      expect(square?.getAttribute('y')).toBe('0');
      expect(square?.getAttribute('width')).toBe('32');
      expect(square?.getAttribute('height')).toBe('32');
    }
  });

  it('tweens each moved entity from its prior logical grid cell', () => {
    const initial = gameFor(baseLevel);
    const afterPush = move(initial, 'right').state;
    const { container, rerender } = render(<Board state={initial} />);

    rerender(<Board state={afterPush} />);

    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-motion')).toBe('moving');
    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-motion-from')).toBe('0:1');
    expect(container.querySelector('[data-entity-id="role"]')?.getAttribute('data-motion-to')).toBe('1:1');
    expect(container.querySelector('[data-entity-id="board-block"]')?.getAttribute('data-motion-from')).toBe('1:1');
    expect(container.querySelector('[data-entity-id="board-block"]')?.getAttribute('data-motion-to')).toBe('2:1');
  });

  it('renders a Gate traversal as an entry segment followed by an exit segment', () => {
    const initial = gameFor(gateLevel);
    const result = move(initial, 'right');
    const { container, rerender } = render(<Board state={initial} />);

    rerender(<Board gateTraversal={result.gateTraversal} state={result.state} />);

    const entry = container.querySelector('[data-teleport-phase="entry"]');
    const exit = container.querySelector('[data-teleport-phase="exit"]');

    expect(entry?.getAttribute('data-entity-id')).toBe('role-teleport-entry');
    expect(entry?.getAttribute('data-motion-from')).toBe('0:1');
    expect(entry?.getAttribute('data-motion-to')).toBe('1:1');
    expect(exit?.getAttribute('data-entity-id')).toBe('role');
    expect(exit?.getAttribute('data-motion-from')).toBe('3:0');
    expect(exit?.getAttribute('data-motion-to')).toBe('4:0');
    expect(exit?.getAttribute('data-motion-from')).not.toBe('0:1');
  });

  it('stages a Spike reset as ingress, impact, and respawn without flying back to origin', () => {
    const afterFirstPush = move(gameFor(spikeResetLevels[0]!), 'right').state;
    const result = move(afterFirstPush, 'right');
    const { container, rerender } = render(<Board state={afterFirstPush} />);

    expect(container.querySelector('[data-origin-for="spike-guide-block"]')?.getAttribute('data-grid-cell')).toBe('2:0');

    rerender(<Board state={result.state} turnEvents={result.events} />);

    const ingress = container.querySelector('[data-reset-phase="ingress"]');
    const impact = container.querySelector('[data-reset-phase="impact"]');
    const respawn = container.querySelector('[data-reset-phase="respawn"]');
    expect(ingress?.getAttribute('data-entity-id')).toBe('spike-guide-block');
    expect(ingress?.getAttribute('data-motion-from')).toBe('3:0');
    expect(ingress?.getAttribute('data-motion-to')).toBe('4:0');
    expect(ingress?.getAttribute('data-reset-window')).toBe('0-180ms');
    expect(impact?.getAttribute('data-grid-cell')).toBe('4:0');
    expect(impact?.getAttribute('data-reset-window')).toBe('180-460ms');
    expect(respawn?.getAttribute('data-grid-cell')).toBe('2:0');
    expect(respawn?.getAttribute('data-reset-window')).toBe('460-820ms');
    const particles = container.querySelectorAll('[data-reset-particle-for="spike-guide-block"]');
    expect(particles).toHaveLength(12);
    expect(Array.from(particles).every((particle) =>
      particle.getAttribute('data-reset-particle-window') === '180-460ms')).toBe(true);
    expect(container.querySelector('[data-motion-from="4:0"][data-motion-to="2:0"]')).toBeNull();

    rerender(<Board state={result.state} turnEvents={[]} />);
    expect(container.querySelector('[data-entity-id="spike-guide-block"]')?.getAttribute('data-motion')).toBeNull();
  });

  it('uses the same reset presentation for Fake Blocks, movable Goals, and Gates', () => {
    const { container } = render(
      <Board state={gameFor(sharedResetPresentationLevel)} turnEvents={sharedResetEvents} />,
    );

    for (const entityId of ['reset-fake', 'reset-goal', 'reset-gate']) {
      expect(container.querySelector(`[data-origin-for="${entityId}"]`)).toBeTruthy();
      expect(container.querySelector(`[data-entity-id="${entityId}"][data-reset-phase="ingress"]`)).toBeTruthy();
      expect(container.querySelector(`[data-entity-id="${entityId}"][data-reset-phase="impact"]`)).toBeTruthy();
      expect(container.querySelector(`[data-entity-id="${entityId}"][data-reset-phase="respawn"]`)).toBeTruthy();
      expect(container.querySelectorAll(`[data-reset-particle-for="${entityId}"]`)).toHaveLength(12);
    }
  });

  it('does not make the whole board focusable when global keyboard controls are active', () => {
    const { container } = render(<Board state={gameFor(baseLevel)} />);

    expect(container.querySelector('[role="grid"]')?.getAttribute('tabindex')).toBeNull();
  });
});
