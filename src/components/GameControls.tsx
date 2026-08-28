import type { Direction, GameState } from '../engine/types';

type GameControlsProps = Readonly<{
  state: GameState;
  onMove: (direction: Direction) => void;
  onNext?: () => void;
  onRestart: () => void;
  onUndo: () => void;
  nextLessonTitle?: string;
}>;

export function GameControls({ state, onMove, onNext, onRestart, onUndo, nextLessonTitle }: GameControlsProps) {
  return (
    <section aria-label="Puzzle controls" className="controls">
      <div className="controls__actions">
        <button disabled={state.history.length === 0} onClick={onUndo} type="button">
          Undo <kbd>Z</kbd>
        </button>
        <button onClick={onRestart} type="button">
          Restart <kbd>R</kbd>
        </button>
        {onNext && nextLessonTitle ? (
          <button className="controls__next" onClick={onNext} type="button">
            下一关
          </button>
        ) : null}
      </div>
      <div aria-label="Move controls" className="controls__pad">
        <button aria-label="Move up" onClick={() => onMove('up')} type="button">
          ↑
        </button>
        <button aria-label="Move left" onClick={() => onMove('left')} type="button">
          ←
        </button>
        <button aria-label="Move down" onClick={() => onMove('down')} type="button">
          ↓
        </button>
        <button aria-label="Move right" onClick={() => onMove('right')} type="button">
          →
        </button>
      </div>
    </section>
  );
}
