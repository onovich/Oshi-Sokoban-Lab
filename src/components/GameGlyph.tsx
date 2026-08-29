/**
 * Oshi renders gameplay with primitive sprite masks, not a general-purpose
 * icon library: a role is a yellow square, a Block is a white square, and the
 * other mechanics are thin geometric marks. Keeping those marks here makes
 * the board and the explanatory legend share the exact same visual language.
 */
export type GameGlyphKind =
  | 'player'
  | 'block'
  | 'fake-block'
  | 'goal'
  | 'movable-goal'
  | 'terrain-goal'
  | 'wall'
  | 'spike'
  | 'moving-spike'
  | 'gate-blue'
  | 'gate-orange';

type GameGlyphProps = Readonly<{
  kind: GameGlyphKind;
  number?: string;
  isComplete?: boolean;
}>;

function GoalCorners() {
  return <path className="game-glyph__goal-corners" d="M2 12V2h10M20 2h10v10M30 20v10H20M12 30H2V20" />;
}

function fillsCell(kind: GameGlyphKind): boolean {
  return kind === 'player'
    || kind === 'block'
    || kind === 'fake-block'
    || kind === 'goal'
    || kind === 'movable-goal'
    || kind === 'terrain-goal';
}

function GlyphShape({ kind }: Pick<GameGlyphProps, 'kind'>) {
  switch (kind) {
    case 'player':
    case 'block':
    case 'fake-block':
      return <rect className="game-glyph__flat-square" height="32" width="32" x="0" y="0" />;
    case 'goal':
    case 'movable-goal':
    case 'terrain-goal':
      return <GoalCorners />;
    case 'wall':
      return <rect className="game-glyph__wall-frame" height="26" width="26" x="3" y="3" />;
    case 'spike':
    case 'moving-spike':
      return <polygon className="game-glyph__spike-burst" points="15,1 19,8 26,3 23,11 31,10 25,16 31,22 23,21 26,29 18,24 15,31 13,23 6,29 9,21 1,22 7,16 1,10 9,11 6,3 13,8" />;
    case 'gate-blue':
    case 'gate-orange':
      return (
        <>
          <rect className="game-glyph__gate-mask-frame" height="28" width="28" x="2" y="2" />
          <rect className="game-glyph__gate-energy-core" height="20" width="20" x="6" y="6" />
        </>
      );
  }
}

export function GameGlyph({ isComplete = false, kind, number }: GameGlyphProps) {
  const isGate = kind === 'gate-blue' || kind === 'gate-orange';
  const isCellFilling = fillsCell(kind);

  return (
    <span
      aria-hidden="true"
      className={`game-glyph game-glyph--${kind}${isCellFilling ? ' game-glyph--cell-filling' : ''}${isComplete ? ' game-glyph--complete' : ''}`}
      data-cell-footprint={isCellFilling ? 'full' : 'mark'}
      data-glyph={kind}
      data-mark="oshi-primitive"
      data-portal-mask={isGate ? 'spr-gate-001' : undefined}
      data-state={isComplete ? 'complete' : undefined}
    >
      {isGate ? (
        <span
          className="game-glyph__portal-energy"
          data-portal-mask-layer="frame-and-core"
          data-portal-parameters="speed-0.5 strength-8 density-2 brightness-2"
          data-portal-shader="twirl-voronoi"
        >
          <span className="game-glyph__portal-voronoi" />
          <span className="game-glyph__portal-vortex" />
        </span>
      ) : null}
      <svg className="game-glyph__svg" focusable="false" viewBox="0 0 32 32">
        <GlyphShape kind={kind} />
      </svg>
      {number ? <span className="game-glyph__number" data-number-style="centered">{number}</span> : null}
    </span>
  );
}
