import { useEffect, useRef, type CSSProperties } from 'react';

import { isBlockSolved } from '../engine/game-engine';
import type { Cell, Direction, GameState, GateTraversal, PathDefinition, ShapedEntityDefinition } from '../engine/types';
import { GameGlyph } from './GameGlyph';
import type { GameGlyphKind } from './GameGlyph';

type BoardProps = Readonly<{
  state: GameState;
  gateTraversal?: GateTraversal;
}>;

type GlyphDefinition = Readonly<{
  key: string;
  kind: GameGlyphKind;
}>;

type VisualEntity = Readonly<{
  id: string;
  kind: GameGlyphKind;
  position: Cell;
  shape: readonly Cell[];
  number?: string;
  isComplete?: boolean;
}>;

type EntityMotion = Readonly<{
  from?: Cell;
  offsetX: number;
  offsetY: number;
}>;

const unitShape: readonly Cell[] = [{ x: 0, y: 0 }];

function sameCell(left: Cell, right: Cell): boolean {
  return left.x === right.x && left.y === right.y;
}

function occupies(entity: ShapedEntityDefinition, cell: Cell): boolean {
  return entity.shape.some(
    (localCell) => entity.position.x + localCell.x === cell.x && entity.position.y + localCell.y === cell.y,
  );
}

function isWallCell(state: GameState, cell: Cell): boolean {
  return state.level.walls.some((wall) => sameCell(wall, cell))
    || (state.level.dynamicWalls ?? []).some((wall) => occupies(wall, cell));
}

function numberFrom(tokens: readonly string[], prefix: string): string | undefined {
  return tokens.find((token) => token.startsWith(prefix))?.slice(prefix.length);
}

function cellTokens(state: GameState, cell: Cell): readonly string[] {
  const tokens: string[] = [];
  if (isWallCell(state, cell)) {
    tokens.push('wall');
    if (!isWallCell(state, { x: cell.x, y: cell.y - 1 })) tokens.push('wall-edge-top');
    if (!isWallCell(state, { x: cell.x + 1, y: cell.y })) tokens.push('wall-edge-right');
    if (!isWallCell(state, { x: cell.x, y: cell.y + 1 })) tokens.push('wall-edge-bottom');
    if (!isWallCell(state, { x: cell.x - 1, y: cell.y })) tokens.push('wall-edge-left');
  }
  if (state.level.terrainGoals.some((goal) => sameCell(goal, cell))) tokens.push('terrain-goal');
  if (state.level.terrainSpikes.some((spike) => sameCell(spike, cell))) tokens.push('terrain-spike');

  for (const goal of state.goals) {
    if (!occupies(goal, cell)) continue;
    tokens.push(goal.movable ? 'movable-goal' : 'goal');
    if (goal.number !== 0) tokens.push(`goal-number-${goal.number}`);
  }
  for (const [index, gate] of state.gates.entries()) {
    if (!occupies(gate, cell)) continue;
    tokens.push('gate');
    tokens.push(index % 2 === 0 ? 'gate-blue' : 'gate-orange');
  }
  for (const spike of state.spikes) {
    if (occupies(spike, cell)) {
      tokens.push('spike');
      const path = state.level.paths.find((definition) => definition.travelerId === spike.id);
      if (path) tokens.push(`moving-spike-${path.loop}`);
    }
  }
  for (const block of state.blocks) {
    if (!occupies(block, cell)) continue;
    tokens.push(block.isFake ? 'fake-block' : 'block');
    if (block.number !== 0) tokens.push(`block-number-${block.number}`);
  }
  if (sameCell(state.player, cell)) tokens.push('player');
  return tokens;
}

function terrainGlyphsFor(tokens: readonly string[]): readonly GlyphDefinition[] {
  const glyphs: GlyphDefinition[] = [];
  if (tokens.includes('terrain-goal')) glyphs.push({ key: 'terrain-goal', kind: 'terrain-goal' });
  if (tokens.includes('terrain-spike')) glyphs.push({ key: 'terrain-spike', kind: 'spike' });
  return glyphs;
}

function labelFor(cell: Cell, tokens: readonly string[]): string {
  const labels: string[] = [];
  const blockNumber = numberFrom(tokens, 'block-number-');
  const goalNumber = numberFrom(tokens, 'goal-number-');

  if (tokens.includes('wall')) labels.push('Wall');
  if (tokens.includes('terrain-goal')) labels.push('地面 Goal');
  if (tokens.includes('terrain-spike')) labels.push('地面 Spike');
  if (tokens.includes('block')) labels.push(blockNumber ? `B${blockNumber} 方块` : '真实方块');
  if (tokens.includes('fake-block')) labels.push('Fake Block');
  if (tokens.includes('goal')) labels.push(goalNumber ? `G${goalNumber} Goal` : 'Goal');
  if (tokens.includes('movable-goal')) labels.push(goalNumber ? `M${goalNumber} 可推动 Goal` : '可推动 Goal');
  if (tokens.includes('gate')) labels.push('Gate');
  if (tokens.includes('spike')) labels.push(tokens.some((token) => token.startsWith('moving-spike-')) ? '移动 Spike' : 'Spike');
  if (tokens.includes('player')) labels.push('角色');

  return `Cell ${cell.x + 1}, ${cell.y + 1}: ${labels.length === 0 ? 'empty' : labels.join('，')}`;
}

function pathPoints(path: PathDefinition): string {
  const nodes = path.loop === 'loop' && path.nodes.length > 1 ? [...path.nodes, path.nodes[0]!] : path.nodes;
  return nodes.map((node) => `${node.x + 0.5},${node.y + 0.5}`).join(' ');
}

function visualEntitiesFor(state: GameState): readonly VisualEntity[] {
  const player: VisualEntity = {
    id: 'role',
    kind: 'player',
    position: state.player,
    shape: unitShape,
  };
  const goals = state.goals.map<VisualEntity>((goal) => ({
    id: goal.id,
    kind: goal.movable ? 'movable-goal' : 'goal',
    position: goal.position,
    shape: goal.shape,
    number: goal.number !== 0 && !state.blocks.some((block) => occupies(block, goal.position)) ? String(goal.number) : undefined,
  }));
  const blocks = state.blocks.map<VisualEntity>((block) => ({
    id: block.id,
    kind: block.isFake ? 'fake-block' : 'block',
    position: block.position,
    shape: block.shape,
    number: block.number !== 0 ? String(block.number) : undefined,
    isComplete: isBlockSolved(state, block),
  }));
  const gates = state.gates.map<VisualEntity>((gate, index) => ({
    id: gate.id,
    kind: index % 2 === 0 ? 'gate-blue' : 'gate-orange',
    position: gate.position,
    shape: gate.shape,
  }));
  const spikes = state.spikes.map<VisualEntity>((spike) => ({
    id: spike.id,
    kind: state.level.paths.some((path) => path.travelerId === spike.id) ? 'moving-spike' : 'spike',
    position: spike.position,
    shape: spike.shape,
  }));

  return [...goals, ...blocks, ...spikes, ...gates, player];
}

function motionFor(entity: VisualEntity, previousEntities: ReadonlyMap<string, VisualEntity>): EntityMotion {
  const previous = previousEntities.get(entity.id);
  if (!previous) return { offsetX: 0, offsetY: 0 };

  return motionBetween(previous.position, entity.position);
}

function motionBetween(from: Cell, to: Cell): EntityMotion {
  return {
    from,
    offsetX: from.x - to.x,
    offsetY: from.y - to.y,
  };
}

function isOriginCell(localCell: Cell): boolean {
  return localCell.x === 0 && localCell.y === 0;
}

function entityCellStyle(cell: Cell, motion: EntityMotion): CSSProperties {
  return {
    gridColumn: cell.x + 1,
    gridRow: cell.y + 1,
    '--motion-x': `${motion.offsetX * 100}%`,
    '--motion-y': `${motion.offsetY * 100}%`,
  } as CSSProperties;
}

function EntityCells({
  entity,
  motion,
  teleportDirection,
  teleportPhase,
}: Readonly<{
  entity: VisualEntity;
  motion: EntityMotion;
  teleportDirection?: Direction;
  teleportPhase?: 'entry' | 'exit';
}>) {
  const isMoving = motion.offsetX !== 0 || motion.offsetY !== 0;

  return entity.shape.map((localCell) => {
    const cell = { x: entity.position.x + localCell.x, y: entity.position.y + localCell.y };
    const number = isOriginCell(localCell) ? entity.number : undefined;
    return (
      <span
        className={`board__entity board__entity--${entity.kind}${isMoving ? ' board__entity--moving' : ''}${teleportPhase ? ` board__entity--teleport-${teleportPhase}` : ''}`}
        data-entity-id={entity.id}
        data-grid-cell={`${cell.x}:${cell.y}`}
        data-grid-unit="1"
        data-motion={isMoving ? 'moving' : undefined}
        data-motion-from={isMoving ? `${motion.from!.x}:${motion.from!.y}` : undefined}
        data-motion-to={isMoving ? `${entity.position.x}:${entity.position.y}` : undefined}
        data-teleport-direction={teleportDirection}
        data-teleport-phase={teleportPhase}
        key={`${entity.id}:${cell.x}:${cell.y}`}
        style={entityCellStyle(cell, motion)}
      >
        <GameGlyph isComplete={entity.isComplete} kind={entity.kind} number={number} />
      </span>
    );
  });
}

function usePreviousState(state: GameState): GameState {
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  return stateRef.current;
}

function PathLayer({ state }: BoardProps) {
  if (state.level.paths.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="board__path-layer"
      preserveAspectRatio="none"
      viewBox={`0 0 ${state.level.width} ${state.level.height}`}
    >
      {state.level.paths.map((path) => (
        <polyline className="board__path" data-path={path.id} key={path.id} points={pathPoints(path)} />
      ))}
    </svg>
  );
}

function EntityLayer({
  gateTraversal,
  previousState,
  state,
}: Readonly<{
  gateTraversal?: GateTraversal;
  previousState: GameState;
  state: GameState;
}>) {
  const entities = visualEntitiesFor(state);
  const previousEntities = previousState.level.id === state.level.id
    ? new Map(visualEntitiesFor(previousState).map((entity) => [entity.id, entity]))
    : new Map<string, VisualEntity>();
  const activeGateTraversal = gateTraversal && sameCell(gateTraversal.to, state.player)
    ? gateTraversal
    : undefined;

  return (
    <div aria-hidden="true" className="board__entity-layer">
      {entities.flatMap((entity) => {
        if (entity.id === 'role' && activeGateTraversal) {
          const entryEntity: VisualEntity = {
            id: 'role-teleport-entry',
            kind: 'player',
            position: activeGateTraversal.entry,
            shape: unitShape,
          };
          return [
            ...EntityCells({
              entity: entryEntity,
              motion: motionBetween(activeGateTraversal.from, activeGateTraversal.entry),
              teleportDirection: activeGateTraversal.direction,
              teleportPhase: 'entry',
            }),
            ...EntityCells({
              entity,
              motion: motionBetween(activeGateTraversal.exit, activeGateTraversal.to),
              teleportDirection: activeGateTraversal.direction,
              teleportPhase: 'exit',
            }),
          ];
        }

        const motion = motionFor(entity, previousEntities);
        return EntityCells({ entity, motion });
      })}
    </div>
  );
}

export function Board({ gateTraversal, state }: BoardProps) {
  const previousState = usePreviousState(state);
  const cells = Array.from({ length: state.level.width * state.level.height }, (_, index) => ({
    x: index % state.level.width,
    y: Math.floor(index / state.level.width),
  }));
  const boardStyle = {
    '--board-columns': state.level.width,
    '--board-rows': state.level.height,
  } as CSSProperties;

  return (
    <div
      aria-label="Current puzzle board"
      className={`board ${state.level.weather === 'rain' ? 'board--rain' : ''}`}
      data-visual-language="oshi-projection"
      role="grid"
      style={boardStyle}
    >
      <PathLayer state={state} />
      <EntityLayer gateTraversal={gateTraversal} previousState={previousState} state={state} />
      {state.level.weather === 'rain' ? <span aria-hidden="true" className="board__weather-film" /> : null}
      {cells.map((cell) => {
        const tokens = cellTokens(state, cell);
        return (
          <div
            aria-label={labelFor(cell, tokens)}
            className={`board__cell ${tokens.map((token) => `board__cell--${token}`).join(' ')}`}
            data-terrain={tokens.includes('wall') ? 'wall' : undefined}
            key={`${cell.x}:${cell.y}`}
            role="gridcell"
          >
            <span className="board__glyph-stack">
              {terrainGlyphsFor(tokens).map((glyph) => <GameGlyph key={glyph.key} kind={glyph.kind} />)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
