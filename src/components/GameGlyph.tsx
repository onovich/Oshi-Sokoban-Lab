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
  return <path className="game-glyph__goal-corners" d="M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7" />;
}

function GlyphShape({ kind }: Pick<GameGlyphProps, 'kind'>) {
  switch (kind) {
    case 'player':
    case 'block':
    case 'fake-block':
      return <rect className="game-glyph__flat-square" height="24" width="24" x="4" y="4" />;
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
          <rect className="game-glyph__gate-frame" height="26" width="26" x="3" y="3" />
          <rect className="game-glyph__gate-inner" height="16" width="16" x="8" y="8" />
        </>
      );
  }
}

export function GameGlyph({ isComplete = false, kind, number }: GameGlyphProps) {
  const isGate = kind === 'gate-blue' || kind === 'gate-orange';

  return (
    <span
      aria-hidden="true"
      className={`game-glyph game-glyph--${kind}${isComplete ? ' game-glyph--complete' : ''}`}
      data-glyph={kind}
      data-mark="oshi-primitive"
      data-state={isComplete ? 'complete' : undefined}
    >
      {isGate ? <span className="game-glyph__portal-energy" /> : null}
      <svg className="game-glyph__svg" focusable="false" viewBox="0 0 32 32">
        <GlyphShape kind={kind} />
      </svg>
      {number ? <span className="game-glyph__number" data-number-style="centered">{number}</span> : null}
    </span>
  );
}
